/* =========================================================================
   SAHE - Solicitud de Horas Extra
   Datos de muestra y utilidades que comparten los tres prototipos.

   EL CASO. Un trabajador pide que le reconozcan tiempo trabajado fuera de
   su jornada. Cuatro cosas definen una solicitud:

       la FECHA        dentro del plazo que deja la configuración
       la UBICACIÓN    la oficina a cuya cuota se carga, elegida por lupa
       el TIEMPO       una cantidad, en múltiplos del parámetro
       el COBRO        pago o compensación, más la modalidad y el motivo

   El TIEMPO es una CANTIDAD y no dos horas del reloj. La pantalla de hoy ya
   lo pide así -en dos cajas, horas por un lado y minutos por otro- y lo que
   hay que arreglar es que suba de 'multiplo' en 'multiplo', no cambiarlo por
   un desde/hasta que nadie pidió y que el paquete no guarda.

   La UBICACIÓN no es la oficina del trabajador: se elige de una lista, y por
   eso cada una trae SU tiempo asignado. Esa cuota es el presupuesto contra
   el que se pide, así que va a la vista en tres sitios: en las fichas de
   arriba, en la propia lupa -para elegir sabiendo lo que queda- y en el pie
   de la grilla.

   El HORARIO es informativo. Se muestra para que la persona se ubique y no
   decide nada: ni limita el tiempo ni rechaza una solicitud.

   Todo en hh:mm porque es como el paquete manda y recibe las horas, y todo
   en minutos por dentro porque sumar '2:45' + '1:30' como texto no es sumar.

   ES5 puro: la intranet corre sobre Chrome 49. Sin grid, sin gap, sin
   flechas ni plantillas de cadena.
   ========================================================================= */
var Sol = (function () {
    "use strict";

    var Sol = {};

    /* ------------------------------------------------------- el trabajador --
       Quién pide. Su horario va aquí porque se MUESTRA, no porque mande. */
    Sol.trabajador = {
        codigo: "0347159",
        nombre: "VALENZUELA ANDER",
        horario: "OFAD - OFIC.ADMINISTRATIVAS L-V 08:30 17:30"
    };

    Sol.periodo = { etiqueta: "Setiembre 2026" };

    /* ------------------------------------------------- lo que ya configuran --
       Dos parámetros del aplicativo. NO son constantes de la pantalla: hoy
       valen 15 y 26, mañana el administrador los cambia y todo lo que
       depende de ellos -la lista de tiempos, el mínimo del calendario, los
       reparos- tiene que moverse solo. Por eso se leen de aquí y no hay un
       15 ni un 26 escrito en ninguna otra parte.

         multiplo  de cuánto en cuánto sube el tiempo que se pide. Con 15,
                   una solicitud es de 0:15, 0:30, 0:45, 1:00... y 2:20 no
                   existe. Puesto a 10, sube de diez en diez.

         plazo     cuántos días hacia atrás se pueden registrar, CONTANDO
                   hoy. Con 26 se llega hasta 25 días antes; puesto a 1,
                   solo queda el día de hoy. Hacia adelante no hay nada que
                   elegir: una hora extra se pide después de haberla hecho. */
    Sol.parametros = { multiplo: 15, plazo: 26 };

    /* -------------------------------------------------------- las ubicaciones
       Las oficinas a las que este trabajador puede cargar horas, con el
       tiempo que la administración le asignó a cada una en el periodo. Es lo
       que reparte T01FUN y es el presupuesto de esta pantalla.

       Son varias, y por eso la oficina se elige: si fuera siempre la misma
       no habría lupa que abrir. */
    Sol.ubicaciones = [
        { codigo: "3450", nombre: "SECCIÓN SISTEMAS ADMINISTRATIVOS", asignado: "40:00" },
        { codigo: "3440", nombre: "SECCIÓN SOPORTE A USUARIOS", asignado: "24:00" },
        { codigo: "3460", nombre: "SECCIÓN BASE DE DATOS", asignado: "16:00" },
        { codigo: "3470", nombre: "SECCIÓN REDES Y COMUNICACIONES", asignado: "8:00" },
        { codigo: "3480", nombre: "SECCIÓN SEGURIDAD INFORMÁTICA", asignado: "0:00" }
    ];

    Sol.cobros = [
        { codigo: "P", nombre: "Pago" },
        { codigo: "C", nombre: "Compensación" }
    ];

    Sol.modalidades = [
        { codigo: "P", nombre: "Presencial" },
        { codigo: "R", nombre: "Remoto" },
        { codigo: "M", nombre: "Mixto" }
    ];

    /* Los tres registros de la captura, ahora con su ubicación y su tiempo
       como cantidad. */
    Sol.solicitudes = [
        { id: 21051, fecha: "2026-09-01", ubicacion: "3450", minutos: 120,
          cobro: "P", modalidad: "P", estado: "A", motivo: "Cierre contable de agosto." },
        { id: 21053, fecha: "2026-09-02", ubicacion: "3450", minutos: 240,
          cobro: "C", modalidad: "P", estado: "A", motivo: "Migración del servidor de reportes." },
        { id: 20974, fecha: "2026-09-04", ubicacion: "3440", minutos: 240,
          cobro: "C", modalidad: "R", estado: "A", motivo: "Atención de incidencias del fin de semana." }
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
       'hh:mm' a minutos y de vuelta. Aquí hh:mm es siempre una CANTIDAD, así
       que puede pasar de 24 horas y no da la vuelta. */
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

    /* ------------------------------------------------------- el múltiplo ---
       El tiempo se ELIGE de una lista de múltiplos, no se teclea. Con eso,
       una cantidad que no cuadre con el parámetro no se puede ni escribir:
       no hay nada que rechazar porque no hay forma de introducirlo.

       El reparo sigue en 'revisar' y no sobra: es la última línea, para el
       día en que alguien mande la trama desde fuera de esta pantalla. Lo que
       ya no hace es aparecerle a nadie. */
    Sol.esMultiplo = function (minutos) {
        var m = Sol.parametros.multiplo;
        return m > 0 && minutos > 0 && (minutos % m) === 0;
    };

    Sol.vecinos = function (minutos) {
        var m = Sol.parametros.multiplo;
        var abajo = Math.floor(minutos / m) * m;
        return { abajo: abajo, arriba: abajo + m };
    };

    /* Los tiempos que se ofrecen: del múltiplo hasta ocho horas. */
    Sol.tiempos = function () {
        var m = Sol.parametros.multiplo;
        var tope = 8 * 60, salida = [], v;
        for (v = m; v <= tope; v += m) salida.push(v);
        return salida;
    };

    Sol.llenarTiempo = function (sel, elegido) {
        var lista = Sol.tiempos(), i;
        if (!sel) return;
        sel.innerHTML = "";
        for (i = 0; i < lista.length; i++) {
            sel.appendChild(new Option(Sol.formatear(lista[i]), String(lista[i])));
        }
        sel.value = String(elegido || Sol.tiempoPorOmision());
    };

    /* Dos horas: es lo que más se pide. Si el múltiplo no divide a 120 -uno
       de 45, por ejemplo- se cae al más cercano que sí exista. */
    Sol.tiempoPorOmision = function () {
        var m = Sol.parametros.multiplo;
        return Math.max(m, Math.round(120 / m) * m);
    };

    /* ------------------------------------------------------- el calendario --
       Fechas como 'aaaa-mm-dd' y nada de Date donde no haga falta: el
       navegador interpreta '2026-09-01' como UTC y en Lima eso es el 31 de
       agosto por la noche. Un día que se corre al pintarlo es un error que
       nadie perdona en una solicitud. */
    var DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                 "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
    var MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun",
                        "jul", "ago", "set", "oct", "nov", "dic"];

    Sol.aFecha = function (iso) {
        var p = String(iso || "").split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    };

    Sol.aIso = function (fecha) {
        var m = fecha.getMonth() + 1, d = fecha.getDate();
        return String(fecha.getFullYear()) + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
    };

    Sol.enTexto = function (iso) {
        var p = String(iso || "").split("-");
        return p[2] + "/" + p[1] + "/" + p[0];
    };

    Sol.enLetra = function (iso) {
        var f = Sol.aFecha(iso);
        return DIAS[f.getDay()] + " " + f.getDate() + " de " + MESES[f.getMonth()];
    };

    Sol.mesCorto = function (fecha) { return MESES_CORTOS[fecha.getMonth()]; };

    Sol.esFinDeSemana = function (iso) {
        var d = Sol.aFecha(iso).getDay();
        return d === 0 || d === 6;
    };

    /* ------------------------------------------------------------ el plazo --
       'hoy' sale del reloj del navegador y no de una constante: un plazo que
       se cuenta desde una fecha escrita a mano deja de ser un plazo al día
       siguiente. */
    Sol.hoy = function () { return Sol.aIso(new Date()); };

    Sol.primerDiaRegistrable = function () {
        var f = new Date();
        f.setDate(f.getDate() - (Sol.parametros.plazo - 1));
        return Sol.aIso(f);
    };

    Sol.enPlazo = function (iso) {
        return iso >= Sol.primerDiaRegistrable() && iso <= Sol.hoy();
    };

    /* Cuántos días le quedan a una fecha antes de salirse del plazo. Es la
       cara útil del parámetro: 'del 16/08 al 10/09' dice el rango, pero lo
       que hace actuar es 'este día se le vence mañana'. Devuelve 0 el último
       día registrable y negativo cuando ya venció. */
    Sol.diasDePlazo = function (iso) {
        var limite = Sol.aFecha(iso);
        var hoy = Sol.aFecha(Sol.hoy());
        limite.setDate(limite.getDate() + Sol.parametros.plazo - 1);
        return Math.round((limite - hoy) / 86400000);
    };

    Sol.urgenciaDe = function (iso) {
        var quedan = Sol.diasDePlazo(iso);
        if (quedan < 0) return { texto: "vencido", clase: "urge--fuera", aprieta: false };
        if (quedan === 0) return { texto: "vence hoy", clase: "urge--hoy", aprieta: true };
        if (quedan === 1) return { texto: "vence mañana", clase: "urge--hoy", aprieta: true };
        if (quedan <= 3) return { texto: "quedan " + quedan + " días", clase: "urge--pronto", aprieta: true };
        return { texto: "quedan " + quedan + " días", clase: "", aprieta: false };
    };

    Sol.prepararFecha = function (input) {
        if (!input) return;
        input.min = Sol.primerDiaRegistrable();
        input.max = Sol.hoy();
    };

    /* ------------------------------------------------ las cuentas por oficina
       Cada ubicación tiene SU cuota y se rinde por separado: lo que sobra en
       una no se puede gastar en otra. De ahí que las cuentas sean una por
       ubicación y no una sola.

       Lo rechazado no cuenta -no se va a pagar- y lo solicitado sí, porque
       lo que está en camino también compromete la cuota: enterarse de que se
       pasó cuando ya está aprobado es tarde. */
    Sol.ubicacionDe = function (codigo) {
        var i;
        for (i = 0; i < Sol.ubicaciones.length; i++) {
            if (Sol.ubicaciones[i].codigo === codigo) return Sol.ubicaciones[i];
        }
        return null;
    };

    Sol.nombreUbicacion = function (codigo) {
        var u = Sol.ubicacionDe(codigo);
        return u ? u.nombre : codigo;
    };

    Sol.usadoDe = function (lista, codigo) {
        var total = 0, i;
        for (i = 0; i < lista.length; i++) {
            if (lista[i].ubicacion === codigo && lista[i].estado !== "R") total += lista[i].minutos;
        }
        return total;
    };

    Sol.saldoDe = function (lista, codigo) {
        var u = Sol.ubicacionDe(codigo);
        var tope = u ? Sol.aMinutos(u.asignado) : 0;
        var usado = Sol.usadoDe(lista, codigo);
        return { tope: tope, usado: usado, queda: tope - usado };
    };

    Sol.totalDe = function (lista) {
        var total = 0, i;
        for (i = 0; i < lista.length; i++) if (lista[i].estado !== "R") total += lista[i].minutos;
        return total;
    };

    /* --------------------------------------------------------- validaciones --
       Una sola puerta para los tres prototipos: cambian en cómo se pide el
       dato, no en qué se acepta. Devuelve el reparo en palabras o "" si está
       conforme. */
    Sol.revisar = function (lista, s) {
        var cerca;

        if (!s.fecha) return "Indique la fecha a solicitar.";
        if (!Sol.enPlazo(s.fecha)) {
            if (s.fecha > Sol.hoy()) {
                return "No se puede pedir un día que todavía no ocurrió. El último es hoy, " +
                       Sol.enTexto(Sol.hoy()) + ".";
            }
            return "Ese día ya venció. Se puede registrar del " +
                   Sol.enTexto(Sol.primerDiaRegistrable()) + " al " + Sol.enTexto(Sol.hoy()) +
                   " (" + Sol.parametros.plazo + " días).";
        }

        if (!s.ubicacion) return "Elija la oficina con la lupa.";
        if (!Sol.ubicacionDe(s.ubicacion)) return "Esa oficina no está en su lista.";

        if (!s.minutos) return "Indique el tiempo solicitado.";
        if (!Sol.esMultiplo(s.minutos)) {
            cerca = Sol.vecinos(s.minutos);
            return "Son " + Sol.formatear(s.minutos) + " y el tiempo sube de " +
                   Sol.formatear(Sol.parametros.multiplo) + " en " + Sol.formatear(Sol.parametros.multiplo) +
                   ". Lo más cerca es " +
                   (cerca.abajo > 0 ? Sol.formatear(cerca.abajo) + " o " : "") +
                   Sol.formatear(cerca.arriba) + ".";
        }

        if (!s.cobro) return "Indique el tipo de cobro.";
        if (!s.modalidad) return "Indique la modalidad de trabajo.";
        if (!s.motivo || s.motivo.length < 5) return "Explique el motivo: es lo que va a leer su jefatura.";
        return "";
    };

    /* Lo que se advierte pero NO impide pedir. Van aparte de 'revisar'
       precisamente porque no rechazan: confundir un dato con una regla es lo
       que convirtió el horario en un obstáculo cuando solo era referencia.

       Pasarse de la cuota se avisa y se deja pasar: quien decide si esas
       horas se pagan es la jefatura, y una solicitud rechazada por la
       pantalla nunca llega a que alguien la mire. */
    Sol.avisos = function (lista, s) {
        var salida = [], saldo, ese, i;

        if (!s.ubicacion || !s.minutos) return salida;

        saldo = Sol.saldoDe(lista, s.ubicacion);
        if (s.id) saldo.queda += minutosGrabados(lista, s.id);
        if (s.minutos > saldo.queda) {
            salida.push("A " + Sol.nombreUbicacion(s.ubicacion) + " le " +
                        (saldo.queda > 0 ? "quedan " + Sol.formatear(saldo.queda) : "queda 0:00") +
                        " de las " + Sol.formatear(saldo.tope) + " asignadas. Puede pedirlo igual.");
        }

        if (s.fecha) {
            for (i = 0; i < lista.length; i++) {
                ese = lista[i];
                if (ese.id === s.id) continue;
                if (ese.fecha === s.fecha && ese.ubicacion === s.ubicacion) {
                    salida.push("Ya pidió " + Sol.formatear(ese.minutos) + " ese día para esa oficina.");
                    break;
                }
            }
        }
        return salida;
    };

    function minutosGrabados(lista, id) {
        var i;
        for (i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i].minutos;
        return 0;
    }

    /* ------------------------------------------------------------ atajos ---- */
    Sol.porId = function (id) { return document.getElementById(id); };

    /* Se escapan también las comillas: este texto no siempre cae entre dos
       etiquetas -a veces va dentro de un value="..."- y un motivo con
       comillas partiría el atributo en dos. */
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
        if (!sel) return;
        sel.innerHTML = "";
        if (vacio) sel.appendChild(new Option(vacio, ""));
        for (i = 0; i < lista.length; i++) {
            sel.appendChild(new Option(lista[i].nombre, lista[i].codigo));
        }
    };

    Sol.reglasEnTexto = function () {
        return "Puede registrar del <b>" + Sol.enTexto(Sol.primerDiaRegistrable()) +
               "</b> al <b>" + Sol.enTexto(Sol.hoy()) + "</b> (" + Sol.parametros.plazo +
               " días) · el tiempo sube de <b>" + Sol.formatear(Sol.parametros.multiplo) +
               "</b> en " + Sol.formatear(Sol.parametros.multiplo);
    };

    /* --------------------------------------------------- la cinta de arriba --
       Quién pide, con qué horario -de referencia- y las dos reglas. La cuota
       no va aquí porque ya no es una: es una por ubicación, y eso son las
       fichas de abajo. */
    Sol.pintarContexto = function (id) {
        var caja = Sol.porId(id), t = Sol.trabajador;
        if (!caja) return;
        caja.className = "contexto";
        caja.innerHTML =
            '<div class="contexto__quien"><b>' + Sol.texto(t.nombre) + "</b>" +
                '<span class="contexto__sep">|</span>Código: ' + Sol.texto(t.codigo) +
                '<div class="contexto__horario">' + Sol.texto(t.horario) +
                    ' <span class="contexto__marca">referencia</span></div></div>' +
            '<div class="contexto__reglas">' + Sol.reglasEnTexto() + "</div>";
    };

    /* Una ficha por ubicación: lo asignado, lo que va pedido y lo que queda.
       Es el presupuesto de la pantalla y por eso está arriba y siempre: un
       número que solo aparece cuando ya te pasaste no sirve de nada. */
    Sol.pintarCuotas = function (id, lista, elegida) {
        var caja = Sol.porId(id), html = "", i, u, s, lleno, pasado;
        if (!caja) return;

        for (i = 0; i < Sol.ubicaciones.length; i++) {
            u = Sol.ubicaciones[i];
            s = Sol.saldoDe(lista, u.codigo);
            pasado = s.queda < 0;
            lleno = s.tope === 0 ? (s.usado > 0 ? 100 : 0)
                                 : Math.min(100, Math.round(s.usado * 100 / s.tope));

            html += '<div class="cuota' + (pasado ? " cuota--excedida" : "") +
                        (elegida === u.codigo ? " cuota--elegida" : "") + '">' +
                        '<div class="cuota__nombre">' + Sol.texto(u.nombre) +
                            '<span class="cuota__codigo"> · ' + Sol.texto(u.codigo) + "</span></div>" +
                        '<div class="cuota__cifras">' +
                            cifra("Asignado", u.asignado, "") +
                            cifra("Solicitado", Sol.formatear(s.usado), "") +
                            cifra(pasado ? "Excedido" : "Queda", Sol.formatear(Math.abs(s.queda)),
                                  pasado ? "cuota__valor--rojo" : "cuota__valor--verde") +
                        "</div>" +
                        '<div class="barrita"><div class="barrita__lleno' +
                            (pasado ? " barrita__lleno--excedido" : "") +
                            '" style="width:' + lleno + '%"></div></div>' +
                    "</div>";
        }
        caja.innerHTML = html;
    };

    function cifra(rotulo, valor, clase) {
        return '<div class="cuota__dato"><div class="cuota__rotulo">' + Sol.texto(rotulo) + "</div>" +
               '<div class="cuota__valor ' + clase + '">' + Sol.texto(valor) + "</div></div>";
    }

    /* =====================================================================
       LA LUPA de oficinas.

       Se arma por código y no en cada HTML por dos razones: es idéntica en
       los tres prototipos -si se copia tres veces, se corrige tres veces- y
       porque así se ve que la lupa es UN componente y no parte del
       formulario que la llama.

       Muestra el código, el nombre y -esto es lo que la hace útil- lo
       asignado y lo que queda de cada oficina: se elige sabiendo contra qué
       presupuesto se va a cargar, en vez de enterarse después.
       ===================================================================== */
    Sol.Lupa = (function () {
        var Lupa = {};
        var alElegir = null;

        Lupa.montar = function () {
            var velo = document.createElement("div");
            velo.className = "velo";
            velo.id = "veloLupa";
            velo.innerHTML =
                '<div class="ventana ventana--ancha">' +
                    '<div class="ventana__barra">' +
                        '<div class="ventana__titulo">Búsqueda de oficinas</div>' +
                        '<button type="button" class="ventana__cerrar" id="lupaCerrar" title="Cerrar">&times;</button>' +
                    "</div>" +
                    '<div class="ventana__cuerpo">' +
                        '<div class="fila"><div class="campo campo--largo">' +
                            '<label class="campo__etiqueta" for="lupaFiltro">Buscar por código o nombre</label>' +
                            '<input type="text" class="control" id="lupaFiltro" placeholder="Escriba para filtrar">' +
                        "</div></div>" +
                        '<div class="rejilla"><table class="tabla">' +
                            "<thead><tr>" +
                                '<th class="col-codigo">Código</th><th>Oficina</th>' +
                                '<th class="der col-tiempo">Asignado</th>' +
                                '<th class="der col-tiempo">Queda</th>' +
                            "</tr></thead>" +
                            '<tbody id="lupaCuerpo"></tbody>' +
                        "</table></div>" +
                        '<p class="campo__ayuda">Una oficina sin tiempo asignado se puede elegir igual: ' +
                            "quien decide es su jefatura.</p>" +
                    "</div>" +
                "</div>";
            document.body.appendChild(velo);

            Sol.porId("lupaCerrar").onclick = Lupa.cerrar;
            Sol.porId("lupaFiltro").oninput = function () { pintar(this.value); };
            velo.onclick = function (e) { if ((e.target || e.srcElement) === velo) Lupa.cerrar(); };
        };

        /* 'fn' recibe la ubicación elegida. La lupa no sabe a qué campo va
           el dato: eso es cosa de quien la abre. */
        Lupa.abrir = function (fn) {
            alElegir = fn;
            Sol.porId("lupaFiltro").value = "";
            pintar("");
            Sol.porId("veloLupa").className = "velo abierto";
            Sol.porId("lupaFiltro").focus();
        };

        Lupa.cerrar = function () { Sol.porId("veloLupa").className = "velo"; };

        function pintar(filtro) {
            var texto = String(filtro || "").toLowerCase();
            var filas = "", i, u, s;

            for (i = 0; i < Sol.ubicaciones.length; i++) {
                u = Sol.ubicaciones[i];
                if (texto !== "" &&
                    u.codigo.toLowerCase().indexOf(texto) === -1 &&
                    u.nombre.toLowerCase().indexOf(texto) === -1) continue;

                s = Sol.saldoDe(Sol.solicitudes, u.codigo);
                filas += '<tr data-codigo="' + u.codigo + '">' +
                            "<td>" + Sol.texto(u.codigo) + "</td>" +
                            "<td>" + Sol.texto(u.nombre) + "</td>" +
                            '<td class="der">' + Sol.texto(u.asignado) + "</td>" +
                            '<td class="der' + (s.queda <= 0 ? " tenue" : "") + '">' +
                                Sol.formatear(Math.max(0, s.queda)) + "</td>" +
                        "</tr>";
            }
            if (filas === "") {
                filas = '<tr class="sin-datos"><td colspan="4">Ninguna oficina coincide.</td></tr>';
            }
            Sol.porId("lupaCuerpo").innerHTML = filas;
            enlazar();
        }

        function enlazar() {
            var filas = Sol.porId("lupaCuerpo").getElementsByTagName("tr"), i;
            for (i = 0; i < filas.length; i++) {
                if (filas[i].getAttribute("data-codigo")) filas[i].onclick = elegir;
            }
        }

        function elegir() {
            var u = Sol.ubicacionDe(this.getAttribute("data-codigo"));
            Lupa.cerrar();
            if (alElegir && u) alElegir(u);
        }

        return Lupa;
    })();

    return Sol;
})();
