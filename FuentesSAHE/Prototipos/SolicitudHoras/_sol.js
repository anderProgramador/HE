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
        var t = Sol.trabajador;
        var minutos = Sol.duracion(s.desde, s.hasta);
        var vecinas, i;

        if (!s.fecha) return "Indique la fecha.";
        if (!s.desde || !s.hasta) return "Indique desde y hasta qué hora se quedó.";
        if (minutos === 0) return "El desde y el hasta son la misma hora.";
        if (minutos > 8 * 60) return "Son " + Sol.formatear(minutos) + " en un día. Revise la hora de salida.";
        if (!s.cobro) return "Indique cómo desea cobrarlo.";
        if (!s.motivo || s.motivo.length < 5) return "Explique el motivo: es lo que va a leer su jefatura.";

        /* Dentro de la jornada no hay hora extra que reconocer: esas horas
           ya se pagan. Es el reparo que hoy nadie hace porque la pantalla
           no sabe a qué hora del día se refiere la cantidad. */
        if (!Sol.esFinDeSemana(s.fecha) && Sol.seCruzan(s.desde, s.hasta, t.entrada, t.salida)) {
            return "Ese tramo cae dentro de su jornada (" + t.entrada + " a " + t.salida + ").";
        }

        vecinas = Sol.delDia(lista, s.fecha, s.id);
        for (i = 0; i < vecinas.length; i++) {
            if (Sol.seCruzan(s.desde, s.hasta, vecinas[i].desde, vecinas[i].hasta)) {
                return "Ya pidió de " + vecinas[i].desde + " a " + vecinas[i].hasta + " ese día.";
            }
        }
        return "";
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
                '<div class="contexto__horario">' + Sol.texto(t.horario) + "</div></div>" +
            '<div class="contexto__cuota">' +
                '<div class="contexto__rotulo">' + Sol.texto(Sol.periodo.etiqueta) + "</div>" +
                '<div class="contexto__cifra' + (pasado ? " contexto__cifra--roja" : "") + '">' +
                    Sol.formatear(s.usado) + " <small>de " + Sol.texto(Sol.cuota.asignada) + "</small></div>" +
                '<div class="barrita"><div class="barrita__lleno' + (pasado ? " barrita__lleno--excedido" : "") +
                    '" style="width:' + lleno + '%"></div></div>' +
            "</div>";
    };

    return Sol;
})();
