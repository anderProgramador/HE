/* ============================================================================
   SAHE - Lo general: lo que cualquier pantalla usaría igual.

   Aquí no vive nada propio de T01. Lo que decide cómo se comporta la
   replicación o cómo filtran los combos de esa ventana está en Sistema.js.

   El campo de archivo adjunto sí es general: se dibuja, se lee y se prepara
   para la trama siempre de la misma forma —solo viaja el NOMBRE del documento,
   y cuando no hay ninguno viaja 'S/R'—, así ninguna pantalla lo resuelve a su
   manera.

   JavaScript nativo, ES5, compatible con Chrome 49. Sin librerías.
   ========================================================================== */
var Comun = (function () {
    "use strict";

    var ICONO = {
        buscar: "<circle cx='11' cy='11' r='7'></circle><line x1='16.5' y1='16.5' x2='21' y2='21'></line>",
        mas: "<line x1='12' y1='5' x2='12' y2='19'></line><line x1='5' y1='12' x2='19' y2='12'></line>",
        editar: "<path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'></path><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z'></path>",
        ver: "<path d='M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z'></path><circle cx='12' cy='12' r='3'></circle>",
        excel: "<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path><polyline points='7 10 12 15 17 10'></polyline><line x1='12' y1='15' x2='12' y2='3'></line>",
        flecha: "<polyline points='6 9 12 15 18 9'></polyline>"
    };

    function svg(nombre, ancho) {
        return "<svg xmlns='http://www.w3.org/2000/svg' width='" + ancho + "' height='" + ancho +
               "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' " +
               "stroke-linecap='round' stroke-linejoin='round'>" + ICONO[nombre] + "</svg>";
    }

    function el(id) { return document.getElementById(id); }

    /* Escapa lo que se arma como HTML. Los nombres de gerencia vienen de la
       base y no del código; con uno que traiga un '<' la tabla se rompe. */
    function texto(valor) {
        return String(valor === null || valor === undefined ? "" : valor)
               .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* ------------------------------------------------------------- números */

    /* Entero con separador de miles por coma, como el resto del aplicativo.
       Un valor vacío se queda vacío y no se convierte en cero. */
    function formatear(valor) {
        var n = aNumero(valor), entero, salida = "", i, cuenta = 0;

        if (String(valor) === "") return "";
        entero = String(Math.abs(Math.round(n)));
        for (i = entero.length - 1; i >= 0; i--) {
            salida = entero.charAt(i) + salida;
            cuenta++;
            if (cuenta % 3 === 0 && i > 0) salida = "," + salida;
        }
        return (n < 0 ? "-" : "") + salida;
    }

    function aNumero(valor) {
        var n = Number(String(valor).replace(/,/g, ""));
        return isNaN(n) ? 0 : n;
    }

    /* ============================================================ ADJUNTO ==
       El campo de archivo adjunto, igual en toda pantalla que lo declare.

       Lo que se guarda y lo que viaja es el NOMBRE del documento, no el
       archivo: la subida es otra cosa. Cuando no hay documento viaja 'S/R'
       —sin referencia—, que es lo que el paquete espera encontrar; mandar la
       cadena vacía correría los campos de la trama.
       ===================================================================== */
    var Adjunto = (function () {

        var SIN_ADJUNTO = "S/R";

        /* El icono de PDF. Va aparte de los demás porque lleva sus letras
           dentro: tiene que leerse como documento a primera vista dentro de la
           fila, sin depender del color. */
        function iconoPdf(ancho) {
            return "<svg xmlns='http://www.w3.org/2000/svg' width='" + ancho + "' height='" + ancho +
                   "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' " +
                   "stroke-linecap='round' stroke-linejoin='round'>" +
                   "<path d='M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z'></path>" +
                   "<polyline points='14 2 14 8 20 8'></polyline>" +
                   "<path d='M7.6 18v-4h1.2a1.05 1.05 0 0 1 0 2.1H7.6'></path>" +
                   "<path d='M11.7 18v-4h.9a1.55 1.55 0 0 1 0 4h-.9z'></path>" +
                   "<path d='M15.9 18v-4h1.9M15.9 16.1h1.4'></path>" +
                   "</svg>";
        }

        /* La celda de la grilla: un botón con el icono de PDF. Sin documento el
           botón queda deshabilitado en lugar de desaparecer, para que la
           columna no se vea desalineada de fila en fila y se entienda que la
           cuota existe pero no tiene sustento. */
        function celda(nombre) {
            var hay = deTrama(nombre) !== "";
            return "<button type='button' class='boton-pdf'" +
                   (hay ? " data-accion='abrirAdjunto' data-archivo='" + texto(nombre) + "'" +
                          " title='" + texto(nombre) + "'"
                        : " disabled title='La cuota no tiene documento adjunto'") +
                   ">" + iconoPdf(17) + "</button>";
        }

        /* Lo que viaja en la trama. */
        function paraTrama(nombre) {
            var limpio = String(nombre || "").replace(/^\s+|\s+$/g, "");
            return limpio === "" ? SIN_ADJUNTO : limpio;
        }

        /* Lo que se muestra cuando el registro llega del paquete: 'S/R' es una
           marca del protocolo, no un nombre de archivo, así que en pantalla se
           ve como campo vacío. */
        function deTrama(valor) {
            var limpio = String(valor || "").replace(/^\s+|\s+$/g, "");
            return limpio === SIN_ADJUNTO ? "" : limpio;
        }

        /* Conecta el campo con su botón de examinar. En el aplicativo el botón
           abre un input file; aquí se simula con un nombre de ejemplo. */
        function armar(idCaja, idBoton) {
            var caja = el(idCaja);
            el(idBoton).onclick = function () {
                var nombres = ["MEMO-CIRCULAR-118-2026.pdf", "INFORME-RRHH-2026-09.pdf",
                               "ACTA-COMITE-2026-09.pdf", "SUSTENTO-CUOTA-2026.pdf"];
                if (this.disabled) return;
                caja.value = nombres[Math.floor(Math.random() * nombres.length)];
            };
        }

        function poner(idCaja, nombre) { el(idCaja).value = deTrama(nombre); }
        function nombre(idCaja) { return el(idCaja).value; }

        function habilitar(idCaja, idBoton, activo) {
            el(idCaja).disabled = !activo;
            el(idBoton).disabled = !activo;
        }

        return {
            SIN_ADJUNTO: SIN_ADJUNTO,
            icono: iconoPdf, celda: celda,
            paraTrama: paraTrama, deTrama: deTrama,
            armar: armar, poner: poner, nombre: nombre, habilitar: habilitar
        };
    })();

    /* --------------------------------------------------------------- lupa */

    /* Una sola ventana de ayuda por pantalla: se arma al cargar y después solo
       se refresca. Al abrirla el filtro arranca en blanco, porque la búsqueda
       anterior no tiene por qué seguir puesta. */
    var alElegir = null;
    var noElegibles = {};

    function abrirLupa(destino, ocupadas) {
        alElegir = destino;
        noElegibles = ocupadas || {};
        el("txtBuscaOfi").value = "";
        pintarLupa("");
        el("veloLupa").className = "velo abierto";
        el("txtBuscaOfi").focus();
    }

    function cerrarLupa() { el("veloLupa").className = "velo"; }

    function pintarLupa(filtro) {
        var lista = Demo.oficinas, i, o, html = "", ocupada;
        var buscado = String(filtro || "").toLowerCase();

        for (i = 0; i < lista.length; i++) {
            o = lista[i];
            if (buscado !== "" &&
                o.codigo.toLowerCase().indexOf(buscado) === -1 &&
                o.nombre.toLowerCase().indexOf(buscado) === -1) continue;

            /* Una oficina que ya tiene cuota en el periodo se muestra pero no
               se puede elegir: repetirla chocaría contra la llave única, y es
               más claro decirlo aquí que después del Grabar. */
            ocupada = noElegibles[o.codigo] === true;
            html += "<tr" + (ocupada ? " class='tenue'" : "") +
                    " data-codigo='" + texto(o.codigo) + "'" +
                    " data-nombre='" + texto(o.nombre) + "'" +
                    " data-ocupada='" + (ocupada ? "1" : "0") + "'>" +
                    "<td>" + texto(o.codigo) + "</td>" +
                    "<td>" + texto(o.nombre) + "</td>" +
                    "<td class='cen'>" + (ocupada ? "Ya tiene cuota" : "Disponible") + "</td></tr>";
        }
        if (html === "") html = "<tr class='sin-datos'><td colspan='3'>Ninguna oficina coincide.</td></tr>";
        el("cuerpoLupa").innerHTML = html;
    }

    function armarLupa() {
        var velo = el("veloLupa");

        el("txtBuscaOfi").oninput = function () { pintarLupa(this.value); };
        el("btnCerrarLupa").onclick = cerrarLupa;
        el("btnCancelarLupa").onclick = cerrarLupa;

        /* Doble clic para elegir: con un clic simple, recorrer la lista con el
           mouse ya sería elegir. */
        el("cuerpoLupa").ondblclick = function (e) {
            var fila = (e.target || e.srcElement);
            while (fila && fila.tagName !== "TR") fila = fila.parentNode;
            if (!fila || !fila.getAttribute("data-codigo")) return;
            if (fila.getAttribute("data-ocupada") === "1") return;
            if (alElegir) alElegir(fila.getAttribute("data-codigo"), fila.getAttribute("data-nombre"));
            cerrarLupa();
        };

        velo.onclick = function (e) { if ((e.target || e.srcElement) === velo) cerrarLupa(); };
    }

    /* El HTML de la ventana de ayuda. */
    function htmlLupa() {
        return "" +
        "<div class='velo' id='veloLupa'>" +
          "<div class='ventana ventana--ancha'>" +
            "<div class='ventana__barra'>" +
              "<div class='ventana__titulo'>Búsqueda de oficinas</div>" +
              "<button type='button' class='ventana__cerrar' id='btnCerrarLupa' title='Cerrar'>&times;</button>" +
            "</div>" +
            "<div class='ventana__cuerpo'>" +
              "<div class='campo campo--largo'>" +
                "<label class='campo__etiqueta' for='txtBuscaOfi'>Código o nombre</label>" +
                "<input type='text' class='control' id='txtBuscaOfi' placeholder='Escriba para filtrar'>" +
                "<div class='campo__ayuda'>Doble clic sobre la oficina para elegirla.</div>" +
              "</div>" +
              "<div class='rejilla' style='max-height:320px;overflow-y:auto'>" +
                "<table class='tabla'><thead><tr>" +
                  "<th class='col-codigo'>Código</th><th>Oficina</th><th class='cen col-codigo'>Estado</th>" +
                "</tr></thead><tbody id='cuerpoLupa'></tbody></table>" +
              "</div>" +
            "</div>" +
            "<div class='ventana__pie'>" +
              "<button type='button' class='boton boton--secundario' id='btnCancelarLupa'>Cancelar</button>" +
            "</div>" +
          "</div>" +
        "</div>";
    }

    /* --------------------------------------------------------------- aviso */

    function avisar(id, tipo, mensaje) {
        var caja = el(id);
        if (mensaje === "") { caja.className = "aviso oculto"; caja.innerHTML = ""; return; }
        caja.className = "aviso aviso--" + tipo;
        caja.innerHTML = mensaje;
    }

    return {
        svg: svg, el: el, texto: texto,
        formatear: formatear, aNumero: aNumero,
        Adjunto: Adjunto,
        armarLupa: armarLupa, abrirLupa: abrirLupa, cerrarLupa: cerrarLupa, htmlLupa: htmlLupa,
        avisar: avisar
    };
})();
