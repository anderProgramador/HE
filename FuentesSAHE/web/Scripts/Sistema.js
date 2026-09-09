/* ============================================================================
   SAHE - Sistema Administrativo de Horas Extra
   Sistema.js  -  arranque de las pantallas de mantenimiento.

   Lee los campos ocultos que dejó la vista, manda construir la ventana y pide
   los datos. Construir, cargar, consultar, validar, grabar, cancelar, armar la
   trama, marcar errores y llevar la auditoría son iguales en todas las
   pantallas y viven en el módulo Ventana de General.js. Los desplegables de
   selección múltiple y el control de las cantidades hh:mm también, porque
   otras pantallas -los reportes, entre ellas- los van a necesitar igual.

   Lo que NO es igual en todas vive aquí, en 'particular': un objeto por
   pantalla con dos ganchos, uno para cuando la ventana ya está construida y
   otro para cuando ya tiene sus datos. Así una regla de una sola pantalla no
   se cuela en la librería ni obliga a un switch que crece con cada pantalla
   nueva.

   JavaScript nativo, ES5, compatible con Chrome 49. Sin librerías.
   ========================================================================== */
var Sistema = (function () {
    "use strict";

    var CONTROLADOR = "SAHE";
    var tabla = "";
    var particular = {};

    function iniciar() {
        var datosTabla = Ventana.valorDe("hdfTabla");
        var controles = Ventana.valorDe("hdfControles");
        var modelo, propio;

        if (!datosTabla || !controles) {
            Ventana.registrar("La pantalla llegó sin tabla o sin plantilla de controles.");
            return;
        }

        tabla = datosTabla.split("¦")[0];

        /* Dos etapas, en este orden: Ventana.crear arma el HTML con sus
           estilos y, cuando la construcción concluye -no antes-, pide los
           datos a SAHE/Cargar y los reparte. Ventana.iniciar encadena las
           dos; la pantalla solo dice qué hacer al final. */
        modelo = Ventana.iniciar(controles, CONTROLADOR, tabla, "PantPri", alCargar);
        if (!modelo) {
            Ventana.registrar("Ventana.crear no devolvió modelo para la tabla " + tabla);
            return;
        }

        if (typeof Mensaje !== "undefined" && Mensaje && typeof Mensaje.configurarMensaje === "function") {
            Mensaje.configurarMensaje();
        }

        if (modelo.titulo) document.title = "SAHE - " + modelo.titulo;

        /* El marcado ya está en el documento: Ventana.crear lo arma de una
           pasada y solo difiere el aviso de que concluyó. Los datos todavía no
           están, por eso lo que dependa de ellos espera al otro gancho. */
        propio = particular[tabla];
        engancharGestion(modelo);
        if (propio && typeof propio.alConstruir === "function") propio.alConstruir(modelo);
    }

    /* Lo propio de esta pantalla una vez que ya tiene sus datos. */
    function alCargar(lectura) {
        var propio = particular[tabla];
        if (propio && typeof propio.alCargar === "function") propio.alCargar(lectura);
    }

    /* Y lo propio de después de consultar y de después de grabar o eliminar,
       para la pantalla que los declare. Son tres ganchos y no uno porque las
       tres respuestas no traen los segmentos en el mismo sitio: en una carga
       el [0] son los combos, en una consulta son ya las filas y en un grabado
       es el mensaje de la acción. La pantalla que no los declara -T01, T05,
       T12...- no se entera de nada y sigue comportándose como siempre. */
    function engancharGestion(modelo) {
        var propio = particular[tabla];
        if (!modelo || !propio) return;
        if (typeof propio.alGestionar === "function") {
            modelo.alGestionar = function (lectura) { propio.alGestionar(lectura); };
        }
        if (typeof propio.alConsultar === "function") {
            modelo.alConsultar = function (lectura) { propio.alConsultar(lectura); };
        }
    }

    /* ------------------------------------------------- de uso compartido -- */

    function leerSesion(clave) {
        try {
            return window.sessionStorage.getItem(clave);
        } catch (e) {
            Ventana.registrar("No se pudo leer " + clave + " de la sesión.", e);
            return null;
        }
    }

    /* Con quién y sobre qué ubicación se está trabajando. Lo deja el escritorio
       al ingresar -y lo cambia el desplegable de su cabecera- en la clave
       'ubicacion' de la sesión:

           cTrabajador|dTrabajador|cPuesto|dPuesto|cUbicacion|dUbicacion|cMovimiento

       Si no estuviera -una pantalla abierta directamente, sin pasar por el
       escritorio- se cae al primer registro de 'datosUsuario', que es el mismo
       que el escritorio habría puesto. */
    function ubicacionDeSesion() {
        var crudo = leerSesion("ubicacion");
        var c;

        if (!crudo) crudo = String(leerSesion("datosUsuario") || "").split("¬")[0];
        c = String(crudo || "").split("|");
        return {
            cTrabajador: c[0] || "", dTrabajador: c[1] || "",
            cUbicacion: c[4] || "", dUbicacion: c[5] || ""
        };
    }

    /* La cantidad de meses se ve siempre: esconderla haría que la ventana
       cambiara de alto al elegir 'Sí' y que el usuario no supiera de
       antemano que ese dato existe. Se habilita solo cuando se pide
       replicar.

       'borrar' distingue las dos maneras de llegar aquí. Cuando el usuario
       cambia el desplegable a 'No', el número que había escrito se
       descarta: lo acaba de rechazar. Cuando la ventana se abre con un
       registro que trajo Obtener, NO se toca: el dato viene de la base y
       borrarlo era hacer desaparecer lo que el paquete acababa de mandar.
       Eso es lo que se veía como 'no setea Meses'. */
    function replicaSegunPeriodo(borrar) {
        var replica = document.getElementById("cboReplicar");
        var meses = document.getElementById("numMeses");
        var aviso = document.getElementById("ayuMeses");
        var quiere, tope;

        if (!replica || !meses) return;
        quiere = replica.value === "S";
        /* El periodo dejó de ser un desplegable y pasó a ser una caja de
           texto, así que su id cambió de 'cbo' a 'txt'. Mientras quedó el
           viejo, valorDe devolvía "" y el tope salía cero: la ventana decía
           que no quedaban meses en el año fuera el periodo que fuera. */
        tope = mesesQueQuedan(Ventana.valorDe("txtPeriodoPop"));

        /* Apagada por la regla, o porque toda la ventana lo está: al ver un
           registro no se cambia nada. */
        meses.disabled = !quiere || replica.disabled;
        meses.setAttribute("max", String(tope));

        if (!quiere) {
            if (borrar === true) meses.value = "";
            if (aviso) aviso.textContent = "Se habilita al elegir Sí.";
            return;
        }
        if (tope === 0) {
            if (borrar === true) meses.value = "";
            meses.disabled = true;
            if (aviso) aviso.textContent = "Es el último periodo del año: no queda mes al que copiar la línea.";
            return;
        }
        if (meses.value === "" || meses.value === "0") meses.value = String(tope);
        if (aviso) {
            aviso.textContent = "Quedan " + tope + (tope === 1 ? " mes" : " meses") +
                                " en el año; la línea se copiará a los siguientes.";
        }
    }

    /* Cuántos meses quedan en el año después del periodo 'aaaamm'. Es el tope
       de la replicación: una línea de setiembre alcanza como mucho a octubre,
       noviembre y diciembre. */
    function mesesQueQuedan(periodo) {
        var mes = Number(String(periodo || "").substring(4, 6));
        if (isNaN(mes) || mes < 1 || mes > 12) return 0;
        return 12 - mes;
    }

    /* El motivo explica un cambio, así que solo tiene sentido cuando lo hay.
       El txt lo declara con 'visible=no' -nace escondido, rótulo, caja y
       contador incluidos- y aquí solo se decide cuándo aparece. En el alta no
       se muestra y su caja queda vacía: al armar la trama viaja el
       'data-default' del txt, sin que nadie haya tenido que escribir ni borrar
       nada.

       Lo usan las dos pantallas de cuotas, que tienen la misma regla. */
    function motivoSegunAccion() {
        var bloque = document.querySelector("[data-campo='Motivo']");
        /* El control se busca dentro de su bloque y no por id: el prefijo
           depende del tipo -'txt' en una caja, 'txa' en un área de texto-, y
           cambiar el tipo en el txt no tiene por qué romper esto. */
        var caja = bloque ? bloque.querySelector(".control") : null;
        var modificando = Ventana.valorDe("hdnCodigoAccion") === "U";

        if (!bloque || !caja) return;
        bloque.hidden = !modificando;
        /* Escondido y no deshabilitado: así 'revisarCampo' lo salta y el
           contador de caracteres no queda contando lo que no se ve. */
        caja.hidden = !modificando;
        if (!modificando) caja.value = "";
    }

    /* ========================================================================
       T01 - Asignación de Cuotas Administrativas

       Dos reglas son propias de esta pantalla, las dos de la ventana de
       mantenimiento:

         1. La cantidad de meses a replicar se ve siempre y solo se habilita
            cuando 'Desea replicar' dice que sí.
         2. El motivo del cambio solo aparece al modificar. En un alta no hay
            nada que explicar todavía, y un campo obligatorio que nadie puede
            llenar con sentido termina lleno de cualquier cosa.

       Los dos desplegables de selección múltiple de la cabecera, el botón
       Consultar y el control del hh:mm no están aquí: los declara el txt y los
       resuelve la librería, porque sirven igual en cualquier pantalla que los
       pida.
       ===================================================================== */
    particular.T01 = (function () {

        var TABLA = "T01";
        var abrirOriginal = null;

        function alConstruir() {
            /* Los dos son cambios del usuario: si dice que no replica, el
               número que hubiera escrito se descarta. */
            enlazar("cboReplicar", function () { replicaSegunPeriodo(true); });
            /* El tope depende del mes, así que cambiar el periodo lo recalcula. */
            enlazar("txtPeriodoPop", function () { replicaSegunPeriodo(true); });

            /* La ventana se abre siempre por el mismo sitio -alta, modificar y
               ver terminan en abrirPopup-, y para entonces los controles ya
               tienen sus valores y sus bloqueos. Enganchar ahí evita adivinar
               cuándo llegó la respuesta de Obtener: con un temporizador, la
               revisión corría antes que el registro. */
            abrirOriginal = Ventana.abrirPopup;
            Ventana.abrirPopup = function (t, titulo) {
                var salida = abrirOriginal.call(Ventana, t, titulo);
                /* Sin borrar: la ventana se acaba de llenar con el registro. */
                if (t === TABLA) { replicaSegunPeriodo(false); motivoSegunAccion(); }
                return salida;
            };
        }

        function alCargar() {
            replicaSegunPeriodo(false);
        }

        function enlazar(id, fn) {
            var nodo = document.getElementById(id);
            if (nodo) nodo.onchange = fn;
        }

        return { alConstruir: alConstruir, alCargar: alCargar };
    })();

    /* ========================================================================
       T01FUN - Distribución de Cuotas (funcionario)

       Dos cosas son propias de esta pantalla:

         1. La carga le manda al paquete con quién y sobre qué ubicación se
            está entrando. Ese dato no está en la pantalla -no hay ningún
            control que lo pida- sino en la sesión, puesto por el escritorio.
         2. La tarjeta de resumen, que no son campos que el usuario llene sino
            el estado de su cuota, y que el paquete manda calculado.

       El desplegable del periodo, el botón Consultar, la lupa, el hh:mm y el
       motivo escondido no están aquí: los declara el txt y los resuelve la
       librería, porque sirven igual en cualquier pantalla que los pida.
       ===================================================================== */
    particular.T01FUN = (function () {

        var TABLA = "T01FUN";
        var abrirOriginal = null;
        /* Lo último que dijo el resumen. La ventana de mantenimiento lo
           necesita -el pendiente es el tope de lo que se puede escribir- y no
           tiene sentido volver a pedirlo: es la misma cifra que ya está
           pintada arriba. */
        var pendienteActual = "";

        /* 'C|<cTrabajador>|<cUbicacion>'. Se registra en la librería como lo
           que esta pantalla le agrega a la trama de la carga; ninguna otra
           carga con esta forma, y por eso vive aquí y no allá. */
        Ventana.datosDeCarga[TABLA] = function () {
            var quien = ubicacionDeSesion();
            return "|" + quien.cTrabajador + "|" + quien.cUbicacion;
        };

        /* El periodo de hoy, 'aaaamm'. Es la frontera entre lo que todavía se
           puede repartir y lo que ya es historia. */
        function periodoActual() {
            var hoy = new Date();
            var mes = hoy.getMonth() + 1;
            return String(hoy.getFullYear()) + (mes < 10 ? "0" + mes : String(mes));
        }

        function esPasado(periodo) {
            var p = String(periodo || "");
            return p !== "" && p < periodoActual();
        }

        /* Un periodo cerrado no se toca. Los repartos futuros sí -existen
           porque alguien replicó-, pero lo de meses anteriores ya se consumió:
           cambiar una cuota de agosto en octubre reescribiría una historia que
           otros ya usaron para pagar.

           Quien lo impide de verdad es el paquete; aquí solo se dejan de
           ofrecer las acciones que la base va a rechazar. Ofrecer un botón que
           siempre falla es peor que no tenerlo. */
        function bloquearSiEsPasado() {
            var cerrado = esPasado(Ventana.valorDe("cboPeriodo"));
            var nodos = document.querySelectorAll("#divPantPri [data-accion]");
            var i, accion;

            for (i = 0; i < nodos.length; i++) {
                accion = nodos[i].getAttribute("data-accion");
                if (accion !== "nuevo" && accion !== "eliminarMultiple" &&
                    accion !== "editar" && accion !== "eliminar") continue;
                /* 'ver' se deja siempre: mirar un periodo cerrado es
                   justamente para lo que se consulta. */
                /* Se apaga con 'display' y no con 'hidden': los botones de la
                   grilla traen su propio display en la hoja de estilos, y ese
                   gana sobre el display:none que el navegador le pone a un
                   elemento escondido. Con 'hidden' se seguían viendo. */
                nodos[i].style.display = cerrado ? "none" : "";
                if (nodos[i].disabled !== undefined) nodos[i].disabled = cerrado;
            }
        }

        /* El resumen llega calculado, en hh:mm:

               <asignada>|<repartida>|<pendiente>

           Detrás de las filas en las tres respuestas, pero no en el mismo
           número de segmento, porque delante de las filas no siempre va lo
           mismo:

               carga     [0] combos, [1] filas ... y el resumen en el [4]
               consulta  [0] filas,  [1] resumen
               gestión   [0] mensaje, [1] filas, [2] resumen

           Una consulta no trae combos ni ayudas ni valores por omisión -eso
           ya está puesto desde la carga y volver a pisarlo le movería al
           usuario los filtros que acaba de elegir-, así que contesta pelada:
           las filas y detrás el resumen del periodo que se pidió. Por eso el
           aviso dice de dónde viene en vez de que esto lo adivine contando
           segmentos.

           No se recalcula con las filas de la grilla: la pantalla ve un
           periodo por vez, y una cuenta armada con lo que está a la vista
           miente en cuanto algo queda fuera de la vista. */
        function segmentoResumen(lectura, origen) {
            var segmentos = (lectura && lectura.segmentos) ? lectura.segmentos : [];
            var i = (origen === "gestion") ? 2 : (origen === "consulta" ? 1 : 4);
            return String(segmentos[i] || "");
        }

        function pintarResumen(lectura, origen) {
            var caja = document.getElementById("secresumen");
            var cifras = segmentoResumen(lectura, origen).split("|");
            var quien = ubicacionDeSesion();
            var asignada = cifras[0] || "";
            var repartida = cifras[1] || "";
            var pendiente = cifras[2] || "";
            var minutos, usados, pasado, periodo, cerrado;

            if (!caja) return;
            if (asignada === "") {
                /* Sin resumen no se dibuja una tarjeta en cero: eso diría que
                   la cuota es cero, que es muy distinto de no saberla. */
                /* Se deja lo que hubiera: un grabado que no manda el resumen
                   es un descuido del paquete, y borrar la tarjeta por eso
                   dejaría la pantalla peor de lo que estaba. */
                Ventana.registrar("La respuesta de " + TABLA + " no trajo el resumen de la cuota.");
                return;
            }

            pendienteActual = pendiente;
            minutos = Grilla.hora.aMinutos(asignada);
            usados = Grilla.hora.aMinutos(repartida);
            pasado = minutos > 0 && usados > minutos;

            periodo = Ventana.valorDe("cboPeriodo");
            cerrado = esPasado(periodo);

            caja.innerHTML =
                '<div class="resumen' + (pasado ? " resumen--excedida" : "") +
                    (cerrado ? " resumen--cerrada" : "") + '">' +
                    '<div class="resumen__titulo">' + texto(quien.dUbicacion) +
                        (cerrado ? '<span class="resumen__marca">Periodo cerrado</span>' : "") +
                        '<span class="resumen__periodo">Periodo ' + texto(periodo) +
                        (cerrado ? " · solo consulta" : "") + "</span></div>" +
                    '<div class="resumen__cifras">' +
                        dato("Asignada", asignada, "") +
                        dato("Repartida", repartida, "") +
                        /* En un periodo cerrado el pendiente ya no es 'lo que
                           puede repartir' sino 'lo que quedó sin repartir': un
                           dato histórico, no una invitación. Por eso no se
                           pinta en verde. */
                        dato(cerrado ? "Sin repartir" : "Pendiente", pendiente,
                             pasado ? "resumen__valor--rojo" : (cerrado ? "" : "resumen__valor--verde")) +
                    "</div>" +
                    '<div class="resumen__barra"><div class="resumen__lleno' +
                        (pasado ? " resumen__lleno--excedido" : "") + '" id="resumenLleno"></div></div>' +
                "</div>";

            /* El ancho es un dato y no una decisión de estilo, así que se pone
               por código. */
            porcentaje("resumenLleno", minutos === 0 ? 0 : Math.min(100, Math.round(usados * 100 / minutos)));
        }

        function dato(rotulo, valor, clase) {
            return '<div class="resumen__dato">' +
                       '<div class="resumen__rotulo">' + texto(rotulo) + "</div>" +
                       '<div class="resumen__valor ' + clase + '">' + texto(valor) + "</div>" +
                   "</div>";
        }

        function porcentaje(id, valor) {
            var nodo = document.getElementById(id);
            if (nodo) nodo.style.width = valor + "%";
        }

        function texto(valor) {
            return String(valor === null || valor === undefined ? "" : valor)
                   .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        /* Aquí iba la regla que encendía una cuota u otra según la oficina
           elegida -global para una dependiente, asignada para la propia-. Por
           ahora las dos se muestran y las dos se pueden escribir: quien decide
           cuál acepta es el paquete. Cuando se quiera de vuelta, es mirar la
           oficina contra 'ubicacionDeSesion().cUbicacion'. */

        /* El pendiente que muestra la tarjeta, repetido dentro de la ventana:
           es el tope de lo que se escriba y leerlo al lado del campo evita
           tener que recordarlo. */
        function pendienteEnVentana() {
            var caja = document.getElementById("txtPendiente");
            if (caja) caja.value = pendienteActual;
        }

        /* La oficina padre -la ubicación de la que sale la cuota- solo hay
           que ponerla al DAR DE ALTA: al modificar y al eliminar viene con la
           fila, porque es parte de la llave de la grilla.

           Se escribe en el campo oculto que declara el txt y TAMBIÉN en su
           'data-default': así sobrevive a un 'limpiar' -cada alta empieza
           limpiando la ventana- sin tener que volver a ponerla cada vez. */
        function fijarOficinaPadre() {
            var caja = document.getElementById("hdnOficinaPadre");
            var propia = ubicacionDeSesion().cUbicacion;

            if (!caja) {
                Ventana.registrar("La plantilla de " + TABLA + " no declara el campo OficinaPadre.");
                return;
            }
            caja.value = propia;
            caja.setAttribute("data-default", propia);
        }

        function alConstruir() {
            fijarOficinaPadre();
            enlazarCampo("cboReplicar", function () { replicaSegunPeriodo(true); });

            /* La ventana se abre siempre por el mismo sitio -alta, modificar y
               ver terminan en abrirPopup-, y para entonces los controles ya
               tienen sus valores y sus bloqueos. */
            abrirOriginal = Ventana.abrirPopup;
            Ventana.abrirPopup = function (t, titulo) {
                var salida = abrirOriginal.call(Ventana, t, titulo);
                if (t === TABLA) {
                    motivoSegunAccion();
                    pendienteEnVentana();
                    replicaSegunPeriodo(false);
                }
                return salida;
            };
        }

        function enlazarCampo(id, fn) {
            var nodo = document.getElementById(id);
            if (!nodo) return;
            nodo.onchange = fn;
            nodo.oninput = fn;
        }

        /* La carga: el resumen viene detrás de los combos, las filas, la
           ayuda y los valores por omisión. */
        function alCargar(lectura) {
            pintarResumen(lectura, "carga");
            bloquearSiEsPasado();
        }

        /* Lo que devuelve el paquete al consultar:

               <filas de la grilla> ~ <resumen>

           La librería ya repintó la grilla con el segmento [0]; lo que falta
           es la tarjeta, que va en el [1]. El resumen tiene que cambiar con el
           periodo -es de UN periodo, el que se acaba de pedir-, así que viaja
           con las filas y en el mismo viaje, sin pedir nada más.

           Y con el periodo cambia también lo que se puede hacer: uno cerrado
           se mira y no se toca. */
        function alConsultar(lectura) {
            pintarResumen(lectura, "consulta");
            bloquearSiEsPasado();
        }

        /* Lo que devuelve el paquete al grabar, modificar o eliminar:

               <mensaje de la acción> ~ <filas de la grilla> ~ <resumen>

           La librería ya repintó la grilla con el segmento [1]; lo que falta
           es la tarjeta, que va en el [2]. Cada línea que entra o sale mueve
           la cuenta de la cuota, así que las dos cosas se rehacen con la misma
           respuesta y sin pedir nada más. */
        function alGestionar(lectura) {
            pintarResumen(lectura, "gestion");
            bloquearSiEsPasado();
        }

        return {
            alConstruir: alConstruir,
            alCargar: alCargar,
            alConsultar: alConsultar,
            alGestionar: alGestionar
        };
    })();

    return {
        iniciar: iniciar,
        tabla: function () { return tabla; }
    };
})();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { Sistema.iniciar(); }, false);
} else {
    Sistema.iniciar();
}
