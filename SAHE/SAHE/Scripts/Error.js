/* ============================================================================
   SAHE - Sistema Administrativo de Horas Extra
   Error.js  -  arma el texto y las acciones de la pantalla de error.

   JavaScript nativo, ES5, compatible con Chrome 49. Sin librerias.
   No usa: let/const, funciones flecha, plantillas de cadena, NodeList.forEach
   ni Element.closest.

   El modulo se llama PaginaError y NO Error, para no tapar el constructor
   Error del navegador.

   Entradas que envia la vista (campos ocultos):
       hdfRaiz        -> @Url.Content("~")
       hdfCodigo      -> @ViewBag.Codigo       404 | 401 | 403 | 500 ...
       hdfReferencia  -> @ViewBag.Referencia   marca para ubicar el log
       hdfOrigen      -> @ViewBag.Origen       ruta que fallo (aspxerrorpath)

   Para ver la pantalla suelta (prototipo) defina window.SAHE_ERROR_DEMO.
   ========================================================================== */

var PaginaError = (function () {
    "use strict";

    var RUTA_ESCRITORIO = "SAHE/Escritorio";
    var RUTA_LOGIN = "SAHE/Login";

    var demo = null;

    function PaginaError() { }

    /* --------------------------------------------------------------- utiles */

    function esc(texto) {
        return String(texto === undefined || texto === null ? "" : texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function valorDe(id) {
        var el = document.getElementById(id);
        return el ? el.value : "";
    }

    function raiz() {
        var base = valorDe("hdfRaiz");
        if (!base) return "/";
        if (base.charAt(base.length - 1) !== "/") base += "/";
        return base;
    }

    /* Solo rutas relativas del propio aplicativo. hdfOrigen viene de la
       cadena de consulta (aspxerrorpath), asi que puede venir manipulada:
       se valida antes de navegar para no convertir la pagina de error en
       un redirector abierto.                                               */
    function rutaSegura(url) {
        var u = String(url || "");
        if (u === "") return false;
        if (u.indexOf("../") !== -1 || u.indexOf("..\\") !== -1) return false;
        if (u.indexOf("//") === 0) return false;
        if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return false;
        return true;
    }

    /* ---------------------------------------------------------------- casos */

    var ICONO_VOLVER = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>';
    var ICONO_REINTENTAR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path><polyline points="21 3 21 9 15 9"></polyline></svg>';

    var CASOS = {
        "404": {
            rotulo: "Página no encontrada",
            titulo: "Esta opción no existe",
            texto: "La dirección solicitada no corresponde a ninguna pantalla del aplicativo. Es posible que la opción haya cambiado de nombre o que el enlace esté desactualizado.",
            acciones: ["escritorio"]
        },
        "500": {
            rotulo: "Error del sistema",
            titulo: "No pudimos completar su solicitud",
            texto: "Ocurrió un problema al procesar la operación. Sus datos no se perdieron. Vuelva a intentarlo en unos minutos y, si el mensaje persiste, comuníquese con Soporte de Informática indicando la referencia que aparece abajo.",
            acciones: ["reintentar", "escritorio"]
        },
        "403": {
            rotulo: "Acceso denegado",
            titulo: "Su perfil no tiene acceso a esta opción",
            texto: "Los permisos del aplicativo los asigna la jefatura de su unidad. Si necesita esta pantalla para su trabajo, solicite la ampliación de su perfil.",
            acciones: ["escritorio"]
        },
        "401": {
            rotulo: "Sesión terminada",
            titulo: "Su sesión expiró por inactividad",
            texto: "Por seguridad, la sesión se cierra luego de un tiempo sin actividad. Vuelva a ingresar con su usuario y su clave host para continuar donde se quedó.",
            acciones: ["ingresar"]
        }
    };

    var BOTONES = {
        escritorio: "<a class='boton' href='#' data-ir='escritorio'>" + ICONO_VOLVER + "Volver al escritorio</a>",
        reintentar: "<a class='boton secundario' href='#' data-ir='reintentar'>" + ICONO_REINTENTAR + "Reintentar</a>",
        ingresar: "<a class='boton' href='#' data-ir='login'>" + ICONO_VOLVER + "Ingresar nuevamente</a>"
    };

    /* --------------------------------------------------------------- pintar */

    PaginaError.pintar = function pintar(codigo) {
        codigo = String(codigo || "500");
        var caso = CASOS[codigo] || CASOS["500"];
        var i, html = "";

        document.getElementById("codigo").innerHTML = esc(codigo);
        document.getElementById("rotulo").innerHTML = caso.rotulo;
        document.getElementById("titulo").innerHTML = caso.titulo;
        document.getElementById("explicacion").innerHTML = caso.texto;
        document.title = "SAHE - " + caso.rotulo;

        for (i = 0; i < caso.acciones.length; i++) html += BOTONES[caso.acciones[i]];
        document.getElementById("acciones").innerHTML = html;
    };

    /* ----------------------------------------------------------- navegacion */

    function irA(ruta) {
        /* window.top: si el error se produjo dentro del marco del escritorio,
           el destino no debe quedar incrustado en ese marco.                 */
        window.top.location.href = raiz() + ruta;
    }

    function reintentar() {
        /* customErrors agrega aspxerrorpath con la ruta que fallo: se vuelve
           ahi, que es lo que el trabajador entiende por "reintentar".        */
        var origen = valorDe("hdfOrigen");
        if (rutaSegura(origen)) {
            window.location.href = origen;
            return;
        }
        if (window.history && window.history.length > 1) {
            window.history.back();
            return;
        }
        irA(RUTA_ESCRITORIO);
    }

    function alPulsar(e) {
        e = e || window.event;
        var destino = e.target || e.srcElement;
        while (destino && !destino.getAttribute) destino = destino.parentNode;
        var ir = destino ? destino.getAttribute("data-ir") : null;
        if (!ir) return;

        if (e.preventDefault) e.preventDefault(); else e.returnValue = false;

        if (demo) { window.alert("Ir a: " + ir + " (demostración)"); return; }

        if (ir === "escritorio") irA(RUTA_ESCRITORIO);
        else if (ir === "login") irA(RUTA_LOGIN);
        else if (ir === "reintentar") reintentar();
    }

    /* --------------------------------------------------------------- inicio */

    PaginaError.iniciar = function iniciar() {
        demo = (typeof window.SAHE_ERROR_DEMO !== "undefined") ? window.SAHE_ERROR_DEMO : null;

        var referencia = valorDe("hdfReferencia");
        if (referencia) document.getElementById("referencia").innerHTML = esc(referencia);

        document.getElementById("acciones").onclick = alPulsar;

        var codigo = valorDe("hdfCodigo");
        if (!codigo && demo) codigo = demo.codigo;
        PaginaError.pintar(codigo || "500");
    };

    return PaginaError;
})();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { PaginaError.iniciar(); }, false);
} else {
    PaginaError.iniciar();
}
