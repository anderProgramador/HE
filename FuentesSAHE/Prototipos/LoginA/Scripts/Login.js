/* ============================================================================
   SAHE - Sistema Administrativo de Horas Extra
   Login.js  (Prototipo A - Institucional)

   Compatibilidad: Chrome 49. Solo ES5: sin let/const, sin arrow functions,
   sin template strings, sin NodeList.forEach, sin includes()/startsWith().
   El contrato con el servidor no cambia: se envia "usuario|clave" al
   controlador Acceso/validarLogin y se interpreta la respuesta del
   Sistema de Claves Host igual que en la version anterior.
   ========================================================================== */

var SAHE_Login = (function () {
    "use strict";

    var LARGO_USUARIO = 4;
    var LARGO_CLAVE = 8;

    var txtUsuario, txtClave, btnIngresar, lblBtnIngresar, spnValida,
        spnContUsuario, spnContClave, cajaUsuario, cajaClave, lblMayus, btnVerClave;

    /* --------------------------------------------------------------- utiles */

    function agregarClase(el, clase) {
        if (!el) return;
        if ((" " + el.className + " ").indexOf(" " + clase + " ") === -1) {
            el.className = el.className === "" ? clase : el.className + " " + clase;
        }
    }

    function quitarClase(el, clase) {
        if (!el) return;
        var partes = el.className.split(/\s+/), salida = [], i;
        for (i = 0; i < partes.length; i++) {
            if (partes[i] !== "" && partes[i] !== clase) salida.push(partes[i]);
        }
        el.className = salida.join(" ");
    }

    function alternarClase(el, clase, activar) {
        if (activar) agregarClase(el, clase); else quitarClase(el, clase);
    }

    function ceroIzq(n) {
        return (n < 10 ? "0" : "") + n;
    }

    /* ------------------------------------------------------------- mensajes */

    function mostrarError(texto) {
        spnValida.innerHTML = texto;
        agregarClase(spnValida, "visible");
    }

    function limpiarError() {
        spnValida.innerHTML = "";
        quitarClase(spnValida, "visible");
        quitarClase(cajaClave, "error");
    }

    /* ------------------------------------------------------------ validacion */

    function normalizar() {
        var u = txtUsuario.value.replace(/[^A-Za-z]/g, "").toUpperCase();
        var c = txtClave.value.replace(/[^A-Za-z0-9]/g, "");

        if (txtUsuario.value !== u) txtUsuario.value = u;
        if (txtClave.value !== c) txtClave.value = c;

        spnContUsuario.innerHTML = u.length + "/" + LARGO_USUARIO;
        spnContClave.innerHTML = c.length + "/" + LARGO_CLAVE;

        var completo = (u.length === LARGO_USUARIO && c.length === LARGO_CLAVE);
        btnIngresar.disabled = !completo;
        return completo;
    }

    function revisarMayusculas(e) {
        if (e && typeof e.getModifierState === "function") {
            alternarClase(lblMayus, "visible", e.getModifierState("CapsLock"));
        }
    }

    /* --------------------------------------------------------- estado boton */

    function marcarOcupado(ocupado) {
        if (ocupado) {
            agregarClase(btnIngresar, "cargando");
            btnIngresar.disabled = true;
            lblBtnIngresar.innerHTML = "Verificando clave host";
        } else {
            quitarClase(btnIngresar, "cargando");
            lblBtnIngresar.innerHTML = "Iniciar sesión";
            normalizar();
        }
    }

    /* ------------------------------------------------------------- ingreso  */

    function ingresar() {
        if (!normalizar()) return;

        limpiarError();
        marcarOcupado(true);

        var data = txtUsuario.value + "|" + txtClave.value;
        var frm = new FormData();
        frm.append("data", data);
        Http.post("Acceso/validarLogin", ingresarWeb, frm);
    }

    /* Respuesta del Sistema de Claves Host. Formato heredado:
       mensaje ~ datosUsuario ~ menu     (los registros multiples van con '¬') */
    function ingresarWeb(rpta) {
        marcarOcupado(false);

        var datos = String(rpta).split("~");
        var mensaje = datos[0].split("|");

        if (mensaje[0] !== "00") {
            var codigoErr = mensaje[0];
            var textoErr = (mensaje[1] || "").toUpperCase();

            if (codigoErr === "98" ||
                textoErr.indexOf("CADENA VACIA") !== -1 ||
                textoErr.indexOf("TEMPORALMENTE INACTIVO") !== -1) {
                mostrarError("Favor de comunicarse con Seguridad de Informática.");
            } else {
                mostrarError(mensaje[1] || "No fue posible validar sus credenciales.");
            }

            agregarClase(cajaClave, "error");
            txtClave.value = "";
            normalizar();
            txtClave.focus();
            return;
        }

        var listaDatosUsuario = (datos[1] || "").split("¬");
        var datosUsuarioArr = [];
        var i, partes;

        for (i = 0; i < listaDatosUsuario.length; i++) {
            partes = listaDatosUsuario[i].split("|");
            if (datosUsuarioArr.length === 0) {
                datosUsuarioArr = partes;
            } else {
                datosUsuarioArr[2] += "/" + partes[2];
                datosUsuarioArr[3] += "/" + partes[3];
                datosUsuarioArr[4] += "/" + partes[4];
                datosUsuarioArr[5] += "/" + partes[5];
            }
        }

        var datosUsuario = datosUsuarioArr.join("|");

        if (datosUsuario.indexOf("E|") === 0) {
            mostrarError(datosUsuario.split("|")[1]);
            return;
        }

        sessionStorage.setItem("datosUsuario", datosUsuario);
        sessionStorage.setItem("menu", datos[2]);
        window.location.href = document.getElementById("hdfRaiz").value + "Inicio/Inicio";
    }

    /* ---------------------------------------------------------------- reloj */

    function pintarReloj() {
        var lblHora = document.getElementById("lblHora");
        var lblFecha = document.getElementById("lblFecha");
        if (!lblHora) return;

        var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                     "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
        var dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
        var d = new Date();

        lblHora.innerHTML = ceroIzq(d.getHours()) + ":" + ceroIzq(d.getMinutes());
        lblFecha.innerHTML = dias[d.getDay()] + ", " + ceroIzq(d.getDate()) + " de " +
                             meses[d.getMonth()] + " de " + d.getFullYear();
    }

    /* -------------------------------------------------------------- enlaces */

    function enlazarCampo(input, caja) {
        input.onfocus = function () { agregarClase(caja, "enfoque"); };
        input.onblur = function () { quitarClase(caja, "enfoque"); };
        input.oninput = function () { normalizar(); };
        input.onkeyup = function (e) { revisarMayusculas(e || window.event); };
        input.onpaste = function () { setTimeout(normalizar, 0); };
    }

    function configurarBotones() {
        btnIngresar.onclick = ingresar;

        btnVerClave.onclick = function () {
            var ver = (txtClave.type === "password");
            txtClave.type = ver ? "text" : "password";
            btnVerClave.innerHTML = ver ? "Ocultar" : "Ver";
            txtClave.focus();
        };
    }

    function iniciar() {
        /* rompe el enmarcado del aplicativo dentro de otro sitio */
        if (window.top !== window.self) window.top.location = window.self.location;

        txtUsuario = document.getElementById("txtUsuario");
        txtClave = document.getElementById("txtClave");
        btnIngresar = document.getElementById("btnIngresar");
        lblBtnIngresar = document.getElementById("lblBtnIngresar");
        spnValida = document.getElementById("spnValida");
        spnContUsuario = document.getElementById("spnContUsuario");
        spnContClave = document.getElementById("spnContClave");
        cajaUsuario = document.getElementById("cajaUsuario");
        cajaClave = document.getElementById("cajaClave");
        lblMayus = document.getElementById("lblMayus");
        btnVerClave = document.getElementById("btnVerClave");

        /* General.js del aplicativo; se valida por si la pagina se abre suelta */
        if (typeof guardarConfiguracion === "function") guardarConfiguracion();

        configurarBotones();
        enlazarCampo(txtUsuario, cajaUsuario);
        enlazarCampo(txtClave, cajaClave);

        /* al completar el usuario, pasa solo a la clave */
        txtUsuario.onkeyup = function (e) {
            revisarMayusculas(e || window.event);
            if (txtUsuario.value.length === LARGO_USUARIO && txtClave.value === "") txtClave.focus();
        };

        document.onkeydown = function (e) {
            e = e || window.event;
            var key = e.keyCode || e.which;
            if (key !== 13) return;

            var activo = document.activeElement ? document.activeElement.id : "";
            if (activo === "txtUsuario" || activo === "txtClave") {
                if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
                if (!btnIngresar.disabled) ingresar();
            }
        };

        normalizar();
        pintarReloj();
        setInterval(pintarReloj, 20000);
        txtUsuario.focus();
    }

    return {
        iniciar: iniciar,
        ingresarWeb: ingresarWeb
    };
})();

window.onload = SAHE_Login.iniciar;

/* Http.post de General.js invoca la funcion por nombre global en algunos
   aplicativos; se expone por compatibilidad. */
function ingresarWeb(rpta) {
    SAHE_Login.ingresarWeb(rpta);
}
