/* ============================================================================
   SAHE - T17  Lo que comparten los tres prototipos: la lupa, el cálculo de
   totales y el control de la fecha.
   JavaScript nativo, ES5, compatible con Chrome 49. Sin librerías.
   ========================================================================== */
var Comun = (function () {
    "use strict";

    var ICONO = {
        buscar: "<circle cx='11' cy='11' r='7'></circle><line x1='16.5' y1='16.5' x2='21' y2='21'></line>",
        mas: "<line x1='12' y1='5' x2='12' y2='19'></line><line x1='5' y1='12' x2='19' y2='12'></line>",
        quitar: "<polyline points='3 6 5 6 21 6'></polyline><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'></path><line x1='10' y1='11' x2='10' y2='17'></line><line x1='14' y1='11' x2='14' y2='17'></line>",
        editar: "<path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'></path><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z'></path>",
        abrir: "<polyline points='6 9 12 15 18 9'></polyline>"
    };

    function svg(nombre, ancho) {
        return "<svg xmlns='http://www.w3.org/2000/svg' width='" + ancho + "' height='" + ancho +
               "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' " +
               "stroke-linecap='round' stroke-linejoin='round'>" + ICONO[nombre] + "</svg>";
    }

    function el(id) { return document.getElementById(id); }

    /* ------------------------------------------------------------- fechas */

    /* La fecha de un cambio no puede ser futura: se registra algo que ya pasó.
       Se pone el tope en el propio control -así el calendario del navegador ya
       no ofrece los días de adelante- y se vuelve a comprobar al escribir,
       porque el usuario puede teclear la fecha sin abrir el calendario. */
    function limitarAHoy(entrada) {
        entrada.setAttribute("max", Demo.hoyISO());
    }

    function esFuturo(valor) {
        return valor !== "" && valor > Demo.hoyISO();
    }

    /* Devuelve el mensaje del problema, o "" si la fecha sirve. */
    function revisarFecha(valor) {
        if (valor === "") return "Indique la fecha.";
        if (esFuturo(valor)) return "La fecha no puede ser posterior a hoy.";
        return "";
    }

    function marcarFecha(entrada, mensaje) {
        entrada.className = mensaje === ""
            ? entrada.className.replace(/\s*control--error/, "")
            : (entrada.className.indexOf("control--error") === -1
               ? entrada.className + " control--error" : entrada.className);
        entrada.title = mensaje;
    }

    /* ------------------------------------------------------------ importes */

    function aNumero(valor) {
        var n = Number(String(valor).replace(/,/g, ""));
        return isNaN(n) ? 0 : n;
    }

    /* --------------------------------------------------------------- lupa */

    /* Una sola ventana de ayuda para todo el prototipo. Se arma la primera vez
       que se abre y después solo se refresca. */
    var alElegir = null;

    function abrirLupa(destino) {
        var velo = el("veloLupa");
        alElegir = destino;
        el("txtBuscaTrab").value = "";
        pintarLupa("");
        velo.className = "velo abierto";
        el("txtBuscaTrab").focus();
    }

    function cerrarLupa() {
        el("veloLupa").className = "velo";
    }

    function pintarLupa(filtro) {
        var cuerpo = el("cuerpoLupa");
        var lista = Demo.trabajadores, i, t, html = "";
        var buscado = String(filtro || "").toLowerCase();

        for (i = 0; i < lista.length; i++) {
            t = lista[i];
            if (buscado !== "" &&
                t.codigo.toLowerCase().indexOf(buscado) === -1 &&
                t.nombre.toLowerCase().indexOf(buscado) === -1) continue;
            html += "<tr data-codigo='" + t.codigo + "' data-nombre='" + t.nombre + "'>" +
                    "<td>" + t.codigo + "</td><td>" + t.nombre + "</td></tr>";
        }
        if (html === "") html = "<tr class='sin-datos'><td colspan='2'>Ningún trabajador coincide.</td></tr>";
        cuerpo.innerHTML = html;
    }

    function armarLupa() {
        var velo = el("veloLupa");
        var cuerpo = el("cuerpoLupa");

        el("txtBuscaTrab").oninput = function () { pintarLupa(this.value); };
        el("btnCerrarLupa").onclick = cerrarLupa;
        el("btnCancelarLupa").onclick = cerrarLupa;

        /* Doble clic para elegir: en una lista larga, un clic simple se dispara
           mientras el usuario todavía está recorriendo con el mouse. */
        cuerpo.ondblclick = function (e) {
            var fila = (e.target || e.srcElement);
            while (fila && fila.tagName !== "TR") fila = fila.parentNode;
            if (!fila || !fila.getAttribute("data-codigo")) return;
            if (alElegir) alElegir(fila.getAttribute("data-codigo"), fila.getAttribute("data-nombre"));
            cerrarLupa();
        };

        velo.onclick = function (e) {
            if ((e.target || e.srcElement) === velo) cerrarLupa();
        };
    }

    return {
        svg: svg, el: el,
        limitarAHoy: limitarAHoy, esFuturo: esFuturo,
        revisarFecha: revisarFecha, marcarFecha: marcarFecha,
        aNumero: aNumero,
        armarLupa: armarLupa, abrirLupa: abrirLupa, cerrarLupa: cerrarLupa
    };
})();
