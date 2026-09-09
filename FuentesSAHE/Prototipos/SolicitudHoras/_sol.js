/* =========================================================================
   SAHE - Solicitud de Horas Extra
   Datos de muestra y utilidades que comparten los tres prototipos.

   EL CASO. Un trabajador pide que le reconozcan el tiempo que se quedó
   fuera de su jornada. Su jornada NO es un dato que él elija: viene de su
   horario -'OFAD - OFIC.ADMINISTRATIVAS L-V 08:30 17:30'- y es lo que
   convierte una hora del reloj en hora extra. Tampoco elige su oficina ni
   el estado en que nace la solicitud.

   Por eso aquí el tiempo se guarda como DOS HORAS DEL RELOJ -desde y
   hasta- y la cantidad se calcula. La pantalla actual hace lo contrario:
   pide la cantidad en dos cajas -horas por un lado, minutos por otro- y
   nunca llega a saber a qué parte del día corresponde. Con el desde/hasta
   se puede avisar de un cruce con la jornada o con otra solicitud del
   mismo día; con una cantidad suelta, no.

   Todo en hh:mm porque es como el paquete manda y recibe las horas, y todo
   en minutos por dentro porque sumar '2:45' + '1:30' como texto no es
   sumar.

   ES5 puro: la intranet corre sobre Chrome 49. Sin grid, sin gap, sin
   flechas ni plantillas de cadena.
   ========================================================================= */
var Sol = (function () {
    "use strict";

    var Sol = {};

    /* --------------------------------------------------------- el contexto --
       Nada de esto se pregunta en la ventana: sale de la sesión. En la
       pantalla de hoy, 'Código Oficina' y 'Oficina' se piden de todas
       formas, y por eso las tres filas de la lista dicen siempre lo mismo:
       SECCIÓN SISTEMAS ADMINISTRATIVOS. Un dato que solo puede tener un
       valor no es una pregunta. */
    Sol.trabajador = {
        codigo: "0347159",
        nombre: "VALENZUELA ANDER",
        oficina: "3450",
        dOficina: "SECCIÓN SISTEMAS ADMINISTRATIVOS",
        horario: "OFAD - OFIC.ADMINISTRATIVAS L-V 08:30 17:30",
        entrada: "08:30",
        salida: "17:30"
    };

    Sol.periodo = { desde: "2026-09-01", hasta: "2026-09-30", etiqueta: "Setiembre 2026" };

    /* ------------------------------------------------- lo que ya configuran --
       Dos parámetros del aplicativo. NO son constantes de la pantalla: hoy
       valen 15 y 26, mañana el administrador los cambia y todo lo que
       depende de ellos -el paso de las cajas de hora, los atajos, el mínimo
       del calendario, los reparos- tiene que moverse solo. Por eso se leen
       de aquí y no hay un 15 ni un 26 escrito en ninguna otra parte.

         multiplo  de cuánto en cuánto suben los minutos que se piden. Con
                   15, una solicitud dura 0:15, 0:30, 0:45, 1:00... y 2:20
                   no existe. Puesto a 10, sube de diez en diez.

         plazo     cuántos días hacia atrás se pueden registrar, CONTANDO
                   hoy. Con 26 se llega hasta 25 días antes; puesto a 1,
                   solo queda el día de hoy. Hacia adelante no hay nada que
                   elegir: una hora extra se pide después de haberla hecho. */
    Sol.parametros = { multiplo: 15, plazo: 26 };

    /* El tope del mes. No es un invento del prototipo: es la cuota que la
       jefatura repartió en T01FUN y contra la que se rinde este mes. Que
       esté a la vista mientras se pide es la diferencia entre enterarse
       ahora o enterarse cuando lo rechacen. */
    Sol.cuota = { asignada: "40:00", oficina: "SECCIÓN SISTEMAS ADMINISTRATIVOS" };

    Sol.cobros = [
        { codigo: "P", nombre: "Pago" },
        { codigo: "C", nombre: "Compensación" }
    ];

    Sol.modalidades = [
        { codigo: "P", nombre: "Presencial" },
        { codigo: "R", nombre: "Remoto" },
        { codigo: "M", nombre: "Mixto" }
    ];

    /* Los tres registros de la captura, con el desde/hasta que la pantalla
       de hoy no guarda. El 01 son dos horas de la tarde y el 02 y el 04
       cuatro horas de un sábado de cierre. */
    Sol.solicitudes = [
        { id: 21051, fecha: "2026-09-01", desde: "17:30", hasta: "19:30", cobro: "P", modalidad: "P",
          estado: "A", motivo: "Cierre contable de agosto." },
        { id: 21053, fecha: "2026-09-02", desde: "17:30", hasta: "21:30", cobro: "C", modalidad: "P",
          estado: "A", motivo: "Migración del servidor de reportes." },
        { id: 20974, fecha: "2026-09-04", desde: "17:30", hasta: "21:30", cobro: "C", modalidad: "P",
          estado: "A", motivo: "Migración del servidor de reportes." }
    ];

    /* Los estados por los que pasa una solicitud. El trabajador NO los
       elige: toda solicitud nace 'Solicitado' y la jefatura la mueve. Que
       hoy sea un desplegable de la ventana es el error más caro de la
       pantalla, porque deja escribir 'Aprobado' a quien pide. */
    Sol.estados = {
        S: { texto: "Solicitado", clase: "pastilla--espera" },
        A: { texto: "Aprobado", clase: "pastilla--ok" },
        R: { texto: "Rechazado", clase: "pastilla--no" }
    };

    /* ------------------------------------------------------------ el reloj --
       'hh:mm' a minutos y de vuelta. Una solicitud que cruza la medianoche
       -entra a las 22:00 y sale a la 1:00- suma un día: sin esto, 'hasta'
       menor que 'desde' daría una cantidad negativa. */
    Sol.aMinutos = function (hhmm) {
        var p = String(hhmm || "").split(":");
        var h = parseInt(p[0], 10), m = parseInt(p[1], 10);
        if (isNaN(h)) h = 0;
        if (isNaN(m)) m = 0;
        return h * 60 + m;
    };

    Sol.formatear = function (minutos) {
        var n = Math.max(0, Math.round(minutos || 0));
        var m = n % 60;
        return String(Math.floor(n / 60)) + ":" + (m < 10 ? "0" + m : String(m));
    };

    /* Una hora DEL RELOJ, con las dos cifras que exige <input type="time">:
       'formatear' vale para una cantidad -'9:30' se lee igual de bien- pero
       ahí el navegador rechaza el valor sin decir nada y la caja aparece
       vacía. Da la vuelta a las 24:00 porque un atajo de cuatro horas desde
       las 22:00 cae en el día siguiente. */
    Sol.reloj = function (minutos) {
        var n = ((Math.round(minutos || 0) % 1440) + 1440) % 1440;
        var h = Math.floor(n / 60), m = n % 60;
        return (h < 10 ? "0" + h : String(h)) + ":" + (m < 10 ? "0" + m : String(m));
    };

    Sol.duracion = function (desde, hasta) {
        var a = Sol.aMinutos(desde), b = Sol.aMinutos(hasta);
        if (b <= a) b += 24 * 60;
        return b - a;
    };

    /* ------------------------------------------------------- el múltiplo ---
       Lo que se pide sube de 'multiplo' en 'multiplo'. Redondear por lo
       bajo y callar sería quitarle minutos a alguien sin decírselo, así que
       aquí solo se pregunta y se ofrecen los dos vecinos; quien decide es
       la persona. */
    Sol.esMultiplo = function (minutos) {
        var m = Sol.parametros.multiplo;
        return m <= 0 || (minutos % m) === 0;
    };

    /* El múltiplo más cercano por debajo y por arriba. El de abajo puede
       quedar en cero -pedir 0:07 con múltiplo de 15-, y entonces no es una
       alternativa que ofrecer. */
    Sol.vecinos = function (minutos) {
        var m = Sol.parametros.multiplo;
        var abajo = Math.floor(minutos / m) * m;
        return { abajo: abajo, arriba: abajo + m };
    };

    /* ------------------------------------------------------------ el plazo --
       'hoy' sale del reloj del navegador y no de una constante: un plazo
       que se cuenta desde una fecha escrita a mano deja de ser un plazo al
       día siguiente. */
    Sol.hoy = function () { return Sol.aIso(new Date()); };

    Sol.primerDiaRegistrable = function () {
        var f = new Date();
        f.setDate(f.getDate() - (Sol.parametros.plazo - 1));
        return Sol.aIso(f);
    };

    Sol.enPlazo = function (iso) {
        return iso >= Sol.primerDiaRegistrable() && iso <= Sol.hoy();
    };

    /* ------------------------------------------------------- el calendario --
       Fechas como 'aaaa-mm-dd' y nada de Date donde no haga falta: el
       navegador interpreta '2026-09-01' como UTC y en Lima eso es el 31 de
       agosto por la noche. Un día que se corre al pintarlo es un error que
       nadie perdona en una solicitud. */
    var DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                 "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];

    Sol.aFecha = function (iso) {
        var p = String(iso || "").split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    };

    Sol.aIso = function (fecha) {
        var m = fecha.getMonth() + 1, d = fecha.getDate();
        return String(fecha.getFullYear()) + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
    };

    /* 'dd/mm/aaaa', que es como se lee una fecha aquí. */
    Sol.enTexto = function (iso) {
        var p = String(iso || "").split("-");
        return p[2] + "/" + p[1] + "/" + p[0];
    };

    Sol.enLetra = function (iso) {
        var f = Sol.aFecha(iso);
        return DIAS[f.getDay()] + " " + f.getDate() + " de " + MESES[f.getMonth()];
    };

    Sol.esFinDeSemana = function (iso) {
        var d = Sol.aFecha(iso).getDay();
        return d === 0 || d === 6;
    };

    /* ---------------------------------------------------------- las cuentas */
    Sol.minutosDe = function (s) { return Sol.duracion(s.desde, s.hasta); };

    /* Lo acumulado del periodo. Lo rechazado no cuenta -no se va a pagar- y
       lo solicitado sí, porque lo que está en camino también compromete la
       cuota: enterarse de que se pasó cuando ya está aprobado es tarde. */
    Sol.acumulado = function (lista) {
        var total = 0, i;
        for (i = 0; i < lista.length; i++) {
            if (lista[i].estado !== "R") total += Sol.minutosDe(lista[i]);
        }
        return total;
    };

    Sol.saldo = function (lista) {
        var tope = Sol.aMinutos(Sol.cuota.asignada);
        var usado = Sol.acumulado(lista);
        return { tope: tope, usado: usado, queda: tope - usado };
    };

    /* Las del día, para avisar de un cruce. Dos solicitudes que se pisan no
       son dos horas extra: son la misma hora pedida dos veces. */
    Sol.delDia = function (lista, fecha, exceptoId) {
        var salida = [], i;
        for (i = 0; i < lista.length; i++) {
            if (lista[i].fecha === fecha && lista[i].id !== exceptoId) salida.push(lista[i]);
        }
        return salida;
    };

    Sol.seCruzan = function (a1, a2, b1, b2) {
        return Sol.aMinutos(a1) < Sol.aMinutos(b2) && Sol.aMinutos(b1) < Sol.aMinutos(a2);
    };

    /* --------------------------------------------------------- validaciones --
       Una sola puerta para los tres prototipos: cambian en cómo se pide el
       dato, no en qué se acepta. Devuelve el reparo en palabras o "" si
       está conforme. */
    Sol.revisar = function (lista, s) {
        var minutos = Sol.duracion(s.desde, s.hasta);
        var vecinas, cerca, i;

        if (!s.fecha) return "Indique la fecha.";

        /* El plazo. Se dice el rango entero y no solo 'fuera de plazo':
           quien se equivocó de día necesita saber cuál sí puede elegir. */
        if (!Sol.enPlazo(s.fecha)) {
            if (s.fecha > Sol.hoy()) {
                return "No se puede pedir un día que todavía no ocurrió. El último es hoy, " +
                       Sol.enTexto(Sol.hoy()) + ".";
            }
            return "Ese día ya venció. Se puede registrar del " +
                   Sol.enTexto(Sol.primerDiaRegistrable()) + " al " + Sol.enTexto(Sol.hoy()) +
                   " (" + Sol.parametros.plazo + " días).";
        }

        if (!s.desde || !s.hasta) return "Indique desde y hasta qué hora se quedó.";
        if (minutos === 0) return "El desde y el hasta son la misma hora.";
        if (minutos > 8 * 60) return "Son " + Sol.formatear(minutos) + " en un día. Revise la hora de salida.";

        /* El múltiplo. El reparo trae los dos vecinos porque decir 'no es
           múltiplo de 15' obliga a la persona a hacer la cuenta que la
           pantalla acaba de hacer. */
        if (!Sol.esMultiplo(minutos)) {
            cerca = Sol.vecinos(minutos);
            return "Son " + Sol.formatear(minutos) + " y el tiempo sube de " +
                   Sol.formatear(Sol.parametros.multiplo) + " en " + Sol.formatear(Sol.parametros.multiplo) +
                   ". Lo más cerca es " +
                   (cerca.abajo > 0 ? Sol.formatear(cerca.abajo) + " o " : "") +
                   Sol.formatear(cerca.arriba) + ".";
        }

        if (!s.cobro) return "Indique cómo desea cobrarlo.";
        if (!s.motivo || s.motivo.length < 5) return "Explique el motivo: es lo que va a leer su jefatura.";

        /* Lo que sí impide pedir: haber pedido ya esas mismas horas. No es
           una regla del horario sino de la propia lista -dos solicitudes
           que se pisan son la misma hora cobrada dos veces- y por eso esta
           sí rechaza. */
        vecinas = Sol.delDia(lista, s.fecha, s.id);
        for (i = 0; i < vecinas.length; i++) {
            if (Sol.seCruzan(s.desde, s.hasta, vecinas[i].desde, vecinas[i].hasta)) {
                return "Ya pidió de " + vecinas[i].desde + " a " + vecinas[i].hasta + " ese día.";
            }
        }
        return "";
    };

    /* El horario es INFORMATIVO: se muestra para que la persona se ubique,
       y no decide nada. Que un tramo caiga dentro de la jornada se cuenta
       -por si se equivocó de hora- pero no impide pedir, así que esto
       devuelve una advertencia y vive aparte de 'revisar', que es la que
       rechaza. Confundir las dos era convertir un dato de referencia en una
       regla que nadie pidió. */
    Sol.avisoHorario = function (s) {
        var t = Sol.trabajador;
        if (!s.fecha || !s.desde || !s.hasta) return "";
        if (Sol.esFinDeSemana(s.fecha)) return "";
        if (!Sol.seCruzan(s.desde, s.hasta, t.entrada, t.salida)) return "";
        return "Ese tramo se cruza con su horario (" + t.entrada + " a " + t.salida +
               "). Es solo un dato: puede pedirlo igual.";
    };

    /* ------------------------------------------------------------ atajos ---- */
    Sol.porId = function (id) { return document.getElementById(id); };

    /* Se escapan también las comillas: este texto no siempre cae entre dos
       etiquetas -el prototipo C lo mete dentro de un value="..."- y un
       motivo con comillas partiría el atributo en dos. */
    Sol.texto = function (v) {
        return String(v === null || v === undefined ? "" : v)
               .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;");
    };

    Sol.nombreDe = function (lista, codigo) {
        var i;
        for (i = 0; i < lista.length; i++) if (lista[i].codigo === codigo) return lista[i].nombre;
        return "";
    };

    Sol.pastilla = function (estado) {
        var e = Sol.estados[estado] || Sol.estados.S;
        return '<span class="pastilla ' + e.clase + '">' + e.texto + "</span>";
    };

    /* Solo lo que todavía no decidió la jefatura se puede tocar. */
    Sol.editable = function (s) { return s.estado === "S"; };

    Sol.llenarSelect = function (sel, lista, vacio) {
        var i;
        sel.innerHTML = "";
        if (vacio) sel.appendChild(new Option(vacio, ""));
        for (i = 0; i < lista.length; i++) {
            sel.appendChild(new Option(lista[i].nombre, lista[i].codigo));
        }
    };

    /* --------------------------------------------- los parámetros en la caja --
       Los dos parámetros no se cuentan solo en los reparos: se aplican a
       los controles, que es donde evitan el error en vez de anunciarlo.

       'step' en un <input type="time"> va en SEGUNDOS, de ahí el por 60. No
       impide teclear un valor fuera de paso -el navegador solo lo usa para
       las flechas y para su propia validación-, así que 'revisar' sigue
       haciendo falta: esto es la comodidad, aquello es la regla. */
    Sol.prepararHora = function (input) {
        if (input) input.step = String(Sol.parametros.multiplo * 60);
    };

    /* El calendario del navegador se abre ya recortado al plazo: los días
       vencidos no se pueden ni elegir. */
    Sol.prepararFecha = function (input) {
        if (!input) return;
        input.min = Sol.primerDiaRegistrable();
        input.max = Sol.hoy();
    };

    /* Los atajos que se ofrecen, en minutos. Se parte de una, dos, tres y
       cuatro horas -que es lo que pide la gente- y cada una se lleva al
       múltiplo más cercano: con 15 o con 10 quedan iguales; con uno de 45,
       la de una hora pasa a 0:45 y así no se ofrece un tiempo que la propia
       pantalla iba a rechazar. Los repetidos se descartan. */
    Sol.atajos = function () {
        var m = Sol.parametros.multiplo;
        var base = [60, 120, 180, 240], salida = [], i, v;

        for (i = 0; i < base.length; i++) {
            v = m > 0 ? Math.max(m, Math.round(base[i] / m) * m) : base[i];
            if (salida.length === 0 || salida[salida.length - 1] !== v) salida.push(v);
        }
        return salida;
    };

    /* Las dos reglas en una línea, para que estén a la vista mientras se
       pide y no solo cuando algo se rechaza. */
    Sol.reglasEnTexto = function () {
        return "Puede registrar del <b>" + Sol.enTexto(Sol.primerDiaRegistrable()) +
               "</b> al <b>" + Sol.enTexto(Sol.hoy()) + "</b> (" + Sol.parametros.plazo +
               " días) · el tiempo sube de <b>" + Sol.formatear(Sol.parametros.multiplo) +
               "</b> en " + Sol.formatear(Sol.parametros.multiplo);
    };

    /* La cinta de contexto: quién pide, con qué horario y cuánto lleva del
       mes. Es igual en los tres, así que se arma una vez. */
    Sol.pintarContexto = function (id, lista) {
        var caja = Sol.porId(id), s = Sol.saldo(lista), t = Sol.trabajador;
        var pasado = s.queda < 0;
        var lleno = s.tope === 0 ? 0 : Math.min(100, Math.round(s.usado * 100 / s.tope));

        if (!caja) return;
        caja.className = "contexto" + (pasado ? " contexto--excedida" : "");
        caja.innerHTML =
            '<div class="contexto__quien"><b>' + Sol.texto(t.nombre) + "</b>" +
                '<span class="contexto__sep">|</span>' + Sol.texto(t.oficina) + " - " + Sol.texto(t.dOficina) +
                '<div class="contexto__horario">' + Sol.texto(t.horario) +
                    ' <span class="contexto__marca">referencia</span></div></div>' +
            '<div class="contexto__cuota">' +
                '<div class="contexto__rotulo">' + Sol.texto(Sol.periodo.etiqueta) + "</div>" +
                '<div class="contexto__cifra' + (pasado ? " contexto__cifra--roja" : "") + '">' +
                    Sol.formatear(s.usado) + " <small>de " + Sol.texto(Sol.cuota.asignada) + "</small></div>" +
                '<div class="barrita"><div class="barrita__lleno' + (pasado ? " barrita__lleno--excedido" : "") +
                    '" style="width:' + lleno + '%"></div></div>' +
            "</div>" +
            '<div class="contexto__reglas">' + Sol.reglasEnTexto() + "</div>";
    };

    return Sol;
})();
