var Escritorio = (function () {
    "use strict";
    var ID_INICIO_POR_DEFECTO = true;
    var RUTA_LOGIN = "SAHE/Login";
    var RUTA_LOGOUT = "SAHE/Logout";
    var demo = null;
    var lateral, divMenu, marco;

    function Escritorio() { }

    function registrar(mensaje, detalle) {
        if (typeof console === "undefined" || !console || !console.error) return;
        if (detalle !== undefined) console.error("[Escritorio] " + mensaje, detalle);
        else console.error("[Escritorio] " + mensaje);
    }

    function esc(texto) {
        return String(texto === undefined || texto === null ? "" : texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function tieneClase(el, clase) {
        return el && (" " + el.className + " ").indexOf(" " + clase + " ") !== -1;
    }

    function agregarClase(el, clase) {
        if (!el || tieneClase(el, clase)) return;
        el.className = (el.className === "" ? clase : el.className + " " + clase);
    }

    function quitarClase(el, clase) {
        if (!el) return;
        var partes = el.className.split(/\s+/), salida = [], i, n = partes.length;
        for (i = 0; i < n; i++) {
            if (partes[i] !== "" && partes[i] !== clase) salida.push(partes[i]);
        }
        el.className = salida.join(" ");
    }

    function contenedorTitulo(el, tope) {
        while (el && el !== tope) {
            if (el.className !== undefined && tieneClase(el, "title")) return el;
            el = el.parentNode;
        }
        return null;
    }

    function leerSesion(clave) {
        try {
            var v = window.sessionStorage.getItem(clave);
            return (v === null || v === "null" || v === "undefined" || v === "") ? null : v;
        } catch (e) {
            return null;
        }
    }

    function limpiarSesion() {
        try { window.sessionStorage.clear(); } catch (e) { /* sin almacenamiento */ }
    }

    function guardarSesion(clave, valor) {
        try {
            window.sessionStorage.setItem(clave, valor);
        } catch (e) {
            registrar("No se pudo guardar " + clave + " en la sesión.", e);
        }
    }

    function raiz() {
        var hdf = document.getElementById("hdfRaiz");
        var base = hdf ? hdf.value : "";
        if (!base) return "/";
        if (base.charAt(base.length - 1) !== "/") base += "/";
        return base;
    }

    function rutaSegura(url) {
        var u = String(url || "");
        if (u === "") return false;
        if (u.indexOf("../") !== -1 || u.indexOf("..\\") !== -1) return false;
        if (u.indexOf("//") === 0) return false;
        if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return false;
        return true;
    }

    var ICONOS = {
        dashboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
        configuracion: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
        proceso: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path><polyline points="21 3 21 9 15 9"></polyline></svg>',
        consulta: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        defecto: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>'
    };
    var ICONO_FLECHA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    function iconoMenu(titulo) {
        var t = (titulo || "").toLowerCase();
        if (t.indexOf("inicio") !== -1 || t.indexOf("dashboard") !== -1) return ICONOS.dashboard;
        if (t.indexOf("config") !== -1) return ICONOS.configuracion;
        if (t.indexOf("proceso") !== -1) return ICONOS.proceso;
        if (t.indexOf("consulta") !== -1 || t.indexOf("reporte") !== -1) return ICONOS.consulta;
        return ICONOS.defecto;
    }

    Escritorio.crearMenu = function crearMenu(dataMenu) {
        if (!divMenu) return;
        var registros = String(dataMenu || "").split("¬");
        var n = registros.length, i, campos, html = "";

        for (i = 0; i < n; i++) {
            campos = registros[i].split("|");
            if (campos.length < 6 || campos[5] !== "00000000") continue;

            var idGrupo = campos[0], titulo = campos[1], url = campos[2], data = campos[3];
            var subMenu = crearSubMenu(registros, idGrupo);
            var tieneSub = subMenu !== "";

            html += "<li class='menu-grupo" + (tieneSub ? "" : " menu-grupo--simple") + "'";
            html += " data-id-menu='" + esc(idGrupo) + "'>";
            html += "<span class='title'";

            if (url) {
                html += " data-navegarmenu='" + esc(url + "?data=" + data) + "'";
                html += " data-titulo='" + esc(titulo) + "'";
            }
            html += ">";
            html += "<span class='menu-icono'>" + iconoMenu(titulo) + "</span>";
            html += "<span class='hide-menu'>" + esc(titulo) + "</span>";
            if (tieneSub) html += "<span class='menu-flecha'>" + ICONO_FLECHA + "</span>";
            html += "</span>";
            html += subMenu;
            html += "</li>";
        }

        divMenu.innerHTML = html;
    };

    function crearSubMenu(registros, idPadre) {
        var n = registros.length, i, campos, nCampos, html = "";
        for (i = 0; i < n; i++) {
            campos = registros[i].split("|");
            nCampos = campos.length;
            if (nCampos < 6) continue;
            if (campos[5] === idPadre && campos[4] === "SM") {
                html += "<li><span class='title navegarMenu'";
                html += " data-navegarmenu='" + esc(campos[2] + "?data=" + campos[3]) + "'";
                html += " data-titulo='" + esc(campos[1]) + "'>";
                html += "<span>" + esc(campos[1]) + "</span>";
                html += "</span></li>";
            }
        }
        return html === "" ? "" : "<ul class='sub-menu'>" + html + "</ul>";
    }

    function marcarActivo(titulo) {
        var previos = divMenu.querySelectorAll(".title.activo");
        var i, n = previos.length;
        for (i = 0; i < n; i++) quitarClase(previos[i], "activo");
        agregarClase(titulo, "activo");
    }

    function alternarGrupo(titulo) {
        var li = titulo.parentNode;
        var abierto = tieneClase(li, "menu-grupo--abierto");
        var grupos = divMenu.children, i, n = grupos.length;
        for (i = 0; i < n; i++) quitarClase(grupos[i], "menu-grupo--abierto");
        if (!abierto) agregarClase(li, "menu-grupo--abierto");
    }

    Escritorio.navegar = function navegar(url, titulo) {
        if (!marco) return false;
        if (!rutaSegura(url)) {
            registrar("Ruta de menú rechazada: " + url);
            return false;
        }
        if (demo) marco.src = demo.contenido + "?op=" + encodeURIComponent(titulo || "");
        else marco.src = raiz() + url;

        if (titulo) document.title = "SAHE - " + titulo;
        cerrarMenu();
        return true;
    };

    /* ------------------------------------------------ datos del usuario -- */

    /* La trama del ingreso trae UN REGISTRO POR UBICACIÓN a cargo, separados
       por ¬:

           cTrabajador|dTrabajador|cPuesto|dPuesto|cUbicacion|dUbicacion|cMovimiento

       El trabajador es el mismo en todos; lo que cambia es el puesto, la
       ubicación y con qué movimiento la ocupa. El PRIMERO es el que manda: es
       el que queda puesto al entrar. */
    var MOVIMIENTOS = { P: "Titular", T: "Encargado" };

    function movimiento(codigo) {
        return MOVIMIENTOS[String(codigo || "").toUpperCase()] || "";
    }

    function registrosDe(datosUsuario) {
        var crudos = String(datosUsuario || "").split("¬");
        var lista = [], i, c;

        for (i = 0; i < crudos.length; i++) {
            if (crudos[i].replace(/^\s+|\s+$/g, "") === "") continue;
            c = crudos[i].split("|");
            lista.push({
                cTrabajador: c[0] || "", dTrabajador: c[1] || "",
                cPuesto: c[2] || "", dPuesto: c[3] || "",
                cUbicacion: c[4] || "", dUbicacion: c[5] || "",
                cMovimiento: c[6] || "", crudo: crudos[i]
            });
        }
        return lista;
    }

    /* La ubicación sobre la que se está trabajando. Se deja en la sesión para
       que las pantallas la puedan leer sin volver a partir la trama. */
    function elegirUbicacion(registro) {
        if (!registro) return;
        guardarSesion("ubicacion", registro.crudo);
    }

    /* El nombre de la ubicación con el movimiento detrás. No es un adorno:
       una cosa es ser titular de la gerencia y otra estar encargado de ella, y
       quien tiene dos a la vez necesita ver cuál es cuál antes de grabar. */
    function rotuloUbicacion(registro) {
        var mov = movimiento(registro.cMovimiento);
        return registro.dUbicacion + (mov === "" ? "" : " · " + mov);
    }

    function comboUbicaciones(lista) {
        var html = "<select id='cboUbicacionUsuario' class='combo-oficina'" +
                   " title='Oficina sobre la que está trabajando'>";
        var i;

        for (i = 0; i < lista.length; i++) {
            html += "<option value='" + esc(lista[i].cUbicacion) + "'" +
                    (i === 0 ? " selected" : "") + ">" +
                    esc(rotuloUbicacion(lista[i])) + "</option>";
        }
        return html + "</select>";
    }

    function registroPorUbicacion(lista, codigo) {
        var i;
        for (i = 0; i < lista.length; i++) {
            if (lista[i].cUbicacion === codigo) return lista[i];
        }
        return null;
    }

    Escritorio.mostrarDatosUsuario = function mostrarDatosUsuario(datosUsuario) {
        var contenedor = document.getElementById("spnNombreEmpleado");
        var lista = registrosDe(datosUsuario);
        var html, combo, mov;

        if (!contenedor) return;
        if (lista.length === 0) {
            contenedor.innerHTML = "";
            registrar("La sesión no trae datos del usuario.");
            return;
        }

        html = "<div class='contenedordatos'>";
        html += "<label id='lblcodigoEmpleado'>Código: </label>" + esc(lista[0].cTrabajador);
        html += "<label class='datoslabel'> Nombres: </label>" + esc(lista[0].dTrabajador);
        html += "<label class='datoslabeloficina'> Oficina: </label>";
        /* Con una sola ubicación no hay nada que elegir y se muestra el rótulo
           de siempre: un desplegable de una sola opción solo invita a buscar
           la que falta. */
        if (lista.length === 1) {
            mov = movimiento(lista[0].cMovimiento);
            html += esc(lista[0].dUbicacion);
            if (mov !== "") html += "<span class='dato-movimiento'>" + esc(mov) + "</span>";
        } else {
            html += comboUbicaciones(lista);
        }
        html += "</div>";
        contenedor.innerHTML = html;

        elegirUbicacion(lista[0]);
        if (lista.length === 1) return;

        combo = document.getElementById("cboUbicacionUsuario");
        if (!combo) return;
        elegida = lista[0].cUbicacion;
        combo.onchange = function () { cambiarUbicacion(this, lista); };
    };

    /* --------------------------------------------- cambio de ubicación --- */

    /* La que estaba puesta antes del último cambio. Sirve para devolver el
       desplegable a su sitio si el usuario se arrepiente: sin esto, cancelar
       dejaba la cabecera diciendo una oficina y la pantalla mostrando otra. */
    var elegida = "";

    function cambiarUbicacion(combo, lista) {
        var registro = registroPorUbicacion(lista, combo.value);
        var anterior = elegida;

        if (!registro || registro.cUbicacion === anterior) return;

        if (!hayCambiosSinGrabar()) {
            aplicarUbicacion(registro);
            return;
        }
        /* Cambiar de ubicación recarga la pantalla, y con ella se va lo que el
           usuario tenía escrito. Se avisa antes: descartar su trabajo sin
           preguntar es peor que hacerle confirmar de más. */
        preguntar("La pantalla abierta tiene cambios sin grabar. Si cambia de oficina se perderán. ¿Continúa?",
            function (rpta) {
                if (rpta) { aplicarUbicacion(registro); return; }
                combo.value = anterior;
            });
    }

    function aplicarUbicacion(registro) {
        elegida = registro.cUbicacion;
        elegirUbicacion(registro);
        /* La pantalla abierta quedó mostrando lo de la ubicación anterior
           -sus filas, su cuota, lo que puede hacer- y no hay forma de
           actualizar eso por partes: se vuelve a cargar entera, que es como si
           el usuario acabara de entrar con la ubicación nueva. */
        recargarPantalla();
    }

    /* ¿La pantalla de adentro tiene algo escrito sin grabar? Se le pregunta a
       ella, que es la única que lo sabe. Vive en el mismo origen, así que se
       la puede consultar; el try cubre el caso de que todavía no haya
       terminado de cargar. */
    function hayCambiosSinGrabar() {
        var ventana, propia;
        try {
            ventana = marco ? marco.contentWindow : null;
            if (!ventana || !ventana.Ventana || !ventana.Sistema) return false;
            if (typeof ventana.Ventana.hayCambios !== "function") return false;
            propia = ventana.Sistema.tabla();
            return propia !== "" && ventana.Ventana.hayCambios(propia) === true;
        } catch (e) {
            return false;
        }
    }

    function recargarPantalla() {
        if (!marco) return;
        try {
            if (marco.contentWindow && marco.contentWindow.location) {
                marco.contentWindow.location.reload();
                return;
            }
        } catch (e) {
            registrar("No se pudo recargar la pantalla; se vuelve a pedir la dirección.", e);
        }
        if (marco.src) marco.src = marco.src;
    }

    function preguntar(mensaje, alResponder) {
        var mostrado = false;
        if (typeof Mensaje !== "undefined" && Mensaje && typeof Mensaje.mostrarMensaje === "function") {
            mostrado = Mensaje.mostrarMensaje("A", mensaje, alResponder) === true;
        }
        if (mostrado) return;
        alResponder(window.confirm(mensaje));
    }

    function abrirMenu() {
        if (!lateral) return;
        lateral.className = "js-sn side-nav side-nav--animatable side-nav--visible";
    }

    function cerrarMenu() {
        if (!lateral) return;
        lateral.className = "js-sn side-nav side-nav--animatable";
    }

    Escritorio.abrirMenu = abrirMenu;
    Escritorio.cerrarMenu = cerrarMenu;

    function cerrarSesion() {
        limpiarSesion();
        window.top.location.href = raiz() + RUTA_LOGOUT;
    }

    /* El escritorio no lleva el marcado de divPM, así que Mensaje no puede
       dibujar nada aquí: hay que mirar lo que devuelve y no solo si la función
       existe. Antes se daba por hecho que había mostrado el aviso y el cierre
       de sesión se quedaba sin hacer nada.                                   */
    function confirmarSalida() {
        var mostrado = false;
        if (typeof Mensaje !== "undefined" && Mensaje && typeof Mensaje.mostrarMensaje === "function") {
            mostrado = Mensaje.mostrarMensaje("A", "¿Desea cerrar su sesión?", function (rpta) {
                if (rpta) cerrarSesion();
            }) === true;
        }
        if (mostrado) return;
        if (window.confirm("¿Desea cerrar su sesión?")) cerrarSesion();
    }

    function irAlLogin() {
        limpiarSesion();
        window.top.location.href = raiz() + RUTA_LOGIN;
    }

    Escritorio.irAlLogin = irAlLogin;

    function enlazarEventos() {
        var btnT = document.getElementById("btnT");
        var btnO = document.getElementById("btnO");
        var btnSalir = document.querySelector(".js_btnCerrarSesion");

        if (btnT) btnT.onclick = abrirMenu;
        if (btnO) btnO.onclick = cerrarMenu;
        if (btnSalir) btnSalir.onclick = confirmarSalida;

        if (lateral) {
            lateral.onclick = function (e) {
                e = e || window.event;
                if ((e.target || e.srcElement) === lateral) cerrarMenu();
            };
        }

        document.onkeydown = function (e) {
            e = e || window.event;
            if ((e.keyCode || e.which) === 27) cerrarMenu();
        };

        if (divMenu) {
            divMenu.onclick = function (e) {
                e = e || window.event;
                var titulo = contenedorTitulo(e.target || e.srcElement, divMenu);
                if (!titulo) return;

                var url = titulo.getAttribute("data-navegarmenu");
                if (url) {
                    marcarActivo(titulo);
                    Escritorio.navegar(url, titulo.getAttribute("data-titulo"));
                    return;
                }
                alternarGrupo(titulo);
            };
        }

        if (typeof Http !== "undefined" && Http) {
            Http.onSesionExpirada = function () { irAlLogin(); };
        }

        /* El diálogo divPantMensaje vive en esta ventana: aquí se dejan
           enganchados sus botones, tanto para el escritorio como para las
           pantallas que lo pidan desde dentro del marco. */
        if (typeof Mensaje !== "undefined" && Mensaje && typeof Mensaje.configurarMensaje === "function") {
            Mensaje.configurarMensaje();
        }
    }

    function abrirPrimeraOpcion() {
        if (!ID_INICIO_POR_DEFECTO || !divMenu) return;
        var primera = divMenu.querySelector(".title[data-navegarmenu]");
        if (!primera) return;
        marcarActivo(primera);
        Escritorio.navegar(primera.getAttribute("data-navegarmenu"), primera.getAttribute("data-titulo"));
    }

    Escritorio.iniciar = function iniciar() {
        lateral = document.querySelector(".js-sn");
        divMenu = document.getElementById("divMenu");
        marco = document.getElementById("ifrPagina");

        demo = (typeof window.SAHE_DEMO !== "undefined") ? window.SAHE_DEMO : null;

        var datosUsuario = leerSesion("datosUsuario");
        var datosMenu = leerSesion("menu");

        if (demo) {
            if (!datosUsuario) datosUsuario = demo.datosUsuario;
            if (!datosMenu) datosMenu = demo.menu;
        }

        if (!datosUsuario || !datosMenu) {
            registrar("No hay datos de sesión; se regresa al ingreso.");
            irAlLogin();
            return;
        }

        enlazarEventos();
        Escritorio.mostrarDatosUsuario(datosUsuario);
        Escritorio.crearMenu(datosMenu);
        //abrirPrimeraOpcion();
    };

    return Escritorio;
})();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { Escritorio.iniciar(); }, false);
} else {
    Escritorio.iniciar();
}
