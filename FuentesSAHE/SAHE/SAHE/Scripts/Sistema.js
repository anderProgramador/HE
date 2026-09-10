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

    /* Dónde viene el resumen dentro de la respuesta. Lo usan las dos
       pantallas que tienen tarjeta -T01FUN y T03- y por eso vive aquí y no
       dentro de una de ellas.

       Llega detrás de las filas en las tres respuestas, pero no en el mismo
       número de segmento, porque delante de las filas no siempre va lo mismo:

           consulta  [0] filas,  [1] resumen
           gestión   [0] mensaje, [1] filas, [2] resumen

       En la CARGA no hay un sitio común: cada paquete ordena sus segmentos
       como quiere -T01FUN manda el resumen al final, en el [4]; T03 lo pone
       en el [2], antes de la ayuda-, así que ese índice lo dice la pantalla
       y no se adivina aquí. Los otros dos sí son iguales porque la forma de
       una consulta y la de un grabado las fija la librería.

       Una consulta no trae combos ni ayudas ni valores por omisión -eso ya
       está puesto desde la carga y volver a pisarlo le movería al usuario los
       filtros que acaba de elegir-, así que contesta pelada.

       No se recalcula con las filas de la grilla: la pantalla ve un tramo por
       vez, y una cuenta armada con lo que está a la vista miente en cuanto
       algo queda fuera de la vista. */
    function segmentoResumen(lectura, origen, enCarga) {
        var segmentos = (lectura && lectura.segmentos) ? lectura.segmentos : [];
        var i = (origen === "gestion") ? 2
              : (origen === "consulta" ? 1 : (enCarga === undefined ? 4 : enCarga));
        return String(segmentos[i] || "");
    }

    /* El filtro y la tarjeta, uno al lado del otro. El txt las declara como
       dos secciones y la librería las apila, que es lo correcto para dos
       bloques de campos; aquí no lo son: a la izquierda se elige y a la
       derecha se lee la cuenta de lo elegido. Apiladas se llevaban media
       pantalla entre las dos y la grilla -que es lo que se viene a mirar-
       empezaba más abajo.

       Se marcan por clase y no por id en la hoja de estilos porque
       'secbusqueda' lo tiene también T01, que sí quiere su filtro entero: son
       cuatro campos y no dos. */
    function emparejarFiltroYResumen(tabla) {
        marcarSeccion(tabla, "secbusqueda", "seccion--filtro");
        marcarSeccion(tabla, "secresumen", "seccion--resumen");
    }

    function marcarSeccion(tabla, id, clase) {
        var nodo = document.getElementById(id);
        if (!nodo) {
            Ventana.registrar("La plantilla de " + tabla + " no declara la sección '" +
                              id + "'; el filtro y el resumen quedan apilados.");
            return;
        }
        if ((" " + nodo.className + " ").indexOf(" " + clase + " ") === -1) {
            nodo.className += " " + clase;
        }
    }

    /* Escapar lo que se pinta con innerHTML. Lo necesitan las dos tarjetas. */
    function texto(valor) {
        return String(valor === null || valor === undefined ? "" : valor)
               .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function porcentaje(id, valor) {
        var nodo = document.getElementById(id);
        if (nodo) nodo.style.width = valor + "%";
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
            emparejarFiltroYResumen(TABLA);
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

    /* ========================================================================
       T03 - Solicitud de Horas Extras (trabajador)

       Lo propio de esta pantalla es leer una carga que NO tiene la forma que
       la librería da por supuesta. El paquete manda cinco segmentos en este
       orden:

           [0] combos    cobro ¦ modalidad ¦ estados
           [1] grilla
           [2] RESUMEN   totalHoras|horasAprobadas|horasSolicitadas|horasPendientes
           [3] AYUDA     las oficinas de la lupa
           [4] POR DEFECTO, y posicionales:
               codigoTrabajador|fechaInicio|fechaFin|fechaInicioPop|
               cantidadMinimaRegistro|cantidadMaximaRegistro|multiploMinutos|
               descripcionHorarioPop

       La librería busca la ayuda siempre en el [2] y los valores por omisión
       como 'clave=valor'. Ninguna de las dos cosas se cumple aquí, así que
       esta pantalla los recoloca DESPUÉS de que la librería reparta: sin eso
       la lupa mostraría las cifras del resumen y los por-omisión quedarían
       vacíos. Se arregla aquí y no en la librería porque no es un error de la
       librería: es que este paquete ordena sus segmentos a su manera, y las
       otras pantallas siguen con la suya.

       Del [4] sale casi todo lo que la pantalla no puede inventar: el rango
       con que se abre el filtro, desde qué día se puede registrar, y el
       mínimo, el máximo y el paso del desplegable de tiempo. El horario es
       informativo: se muestra en la ventana y no limita nada.
       ===================================================================== */
    particular.T03 = (function () {

        var TABLA = "T03";
        /* En la carga, el resumen viene antes que la ayuda. */
        var RESUMEN_EN_CARGA = 2;
        var AYUDA_EN_CARGA = 3;
        var POR_DEFECTO_EN_CARGA = 4;

        /* El tope del desplegable: 17 horas por solicitud. Es una regla del
           negocio y por eso está escrita, no calculada. La carga no la manda
           -sus dos 'cantidades' son el plazo, no horas-, así que si algún día
           pasa a configurarse llegará en la trama y esta línea se cambia por
           el dato que venga. */
        var TOPE = 17 * 60;

        var abrirOriginal = null;
        var modeloPantalla = null;
        /* Lo que trajo el [4], ya partido. Se guarda porque la ventana lo
           necesita cada vez que se abre y no tiene sentido volver a pedirlo. */
        var ajustes = null;

        /* 'C|<cTrabajador>|<cUbicacion>'. Se registra en la librería como lo
           que esta pantalla le agrega a la trama de la carga. */
        Ventana.datosDeCarga[TABLA] = function () {
            var quien = ubicacionDeSesion();
            return "|" + quien.cTrabajador + "|" + quien.cUbicacion;
        };

        /* ------------------------------------------------ el cuarto segmento
           Posicional, no 'clave=valor', así que se lee por orden. Un campo que
           no venga queda en blanco y quien dependa de él se comporta como si
           no existiera, en vez de inventarse un valor. */
        function leerAjustes(lectura) {
            var crudo = String((lectura.segmentos || [])[POR_DEFECTO_EN_CARGA] || "");
            var c = crudo.split("|");

            ajustes = {
                trabajador: c[0] || "",
                fechaInicio: c[1] || "",
                fechaFin: c[2] || "",
                fechaInicioPop: c[3] || "",
                /* Los dos extremos del plazo: el día más antiguo que se
                   puede registrar y el más reciente. Se aceptan de las DOS
                   maneras en que pueden venir -ya como fecha, o como una
                   cantidad de días hacia atrás desde hoy- y por eso se
                   guardan crudos: quien los usa decide.

                   Aceptar las dos no es indecisión: es que el paquete y la
                   pantalla se despliegan por separado, y así el día que la
                   trama pase de mandar '26' a mandar '15/08/2026' no hace
                   falta que las dos cosas salgan a la vez. */
                desdePop: c[4] || "",
                hastaPop: c[5] || "",
                multiplo: enMinutos(c[6]),
                horario: c[7] || ""
            };
            if (crudo === "") {
                Ventana.registrar("La carga de " + TABLA + " no trajo el segmento de valores " +
                                  "por defecto; el filtro nace vacío y el tiempo sin límites.");
            }
        }

        /* Una cantidad puede venir en minutos -'15'- o en hh:mm -'00:15'-.
           Se aceptan las dos: adivinar mal el formato de un tope convierte un
           desplegable de ocho horas en uno de ocho minutos. */
        function enMinutos(valor) {
            var texto = String(valor === undefined || valor === null ? "" : valor);
            var partes, h, m, n;

            if (texto === "") return 0;
            if (texto.indexOf(":") >= 0) {
                partes = texto.split(":");
                h = parseInt(partes[0], 10);
                m = parseInt(partes[1], 10);
                return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
            }
            n = parseInt(texto, 10);
            return isNaN(n) ? 0 : n;
        }

        /* La ayuda, en su sitio. La librería la dejó apuntando al [2] -que
           aquí es el resumen-, así que se corrige antes de que alguien abra
           la lupa. */
        function corregirAyuda(lectura) {
            var segmentos = lectura.segmentos || [];
            if (!modeloPantalla) return;
            modeloPantalla.datosAyuda = [String(segmentos[AYUDA_EN_CARGA] || "")];
        }

        /* ------------------------------------------------------- las fechas
           El filtro y la ventana usan <input type="date">, que solo entiende
           'aaaa-mm-dd'. El paquete escribe las fechas como '02/09/2026' en la
           grilla, así que se admiten las dos formas y se normaliza. */
        function enIsoTexto(valor) {
            var texto = String(valor || "").replace(/^\s+|\s+$/g, "");
            var p;

            if (texto === "") return "";
            if (texto.indexOf("/") >= 0) {
                p = texto.split("/");
                if (p.length !== 3) return "";
                return p[2] + "-" + dos(p[1]) + "-" + dos(p[0]);
            }
            return texto;
        }

        function dos(n) {
            var t = String(n);
            return t.length < 2 ? "0" + t : t;
        }

        function enIso(fecha) {
            return String(fecha.getFullYear()) + "-" +
                   dos(fecha.getMonth() + 1) + "-" + dos(fecha.getDate());
        }

        function hoy() { return enIso(new Date()); }

        /* El rango con que se abre el filtro. Solo se pone lo que venga: si
           el paquete no manda fechas, el usuario las elige. */
        function aplicarFiltro() {
            ponerFecha("datFechaInicio", enIsoTexto(ajustes.fechaInicio));
            ponerFecha("datFechaFin", enIsoTexto(ajustes.fechaFin));
        }

        function ponerFecha(id, valor) {
            var caja = document.getElementById(id);
            if (caja && valor !== "") caja.value = valor;
        }

        /* El plazo, puesto sobre el calendario de la ventana. Los dos
           extremos llegan como CANTIDAD DE DÍAS hacia atrás desde hoy, no
           como fechas: 'cantidadMinimaRegistro' es el día más antiguo que se
           puede registrar y 'cantidadMaximaRegistro' el más reciente, que en
           0 es hoy.

           Se cuentan aquí y no se guardan hechos fecha porque un plazo
           contado al cargar deja de ser el plazo al día siguiente, y esta
           pantalla se queda abierta. Por eso se recalcula cada vez que se
           abre la ventana.

           Los dos se ordenan antes de usarlos: cuál de las dos cantidades es
           la mayor lo decide la configuración, y si algún día vinieran al
           revés el campo seguiría teniendo un rango con sentido en vez de uno
           imposible. */
        function recortarFecha() {
            var caja = document.getElementById("datFechaPop");
            var ayuda = document.getElementById("ayuFechaPop");
            var uno, otro, desde, hasta;

            if (!caja || !ajustes) return;
            uno = comoFecha(ajustes.desdePop);
            otro = comoFecha(ajustes.hastaPop);

            if (uno === "" && otro === "") {
                if (ayuda) ayuda.textContent = "";
                Ventana.registrar("La carga de " + TABLA + " no trajo los extremos del plazo; " +
                                  "la fecha queda sin recortar y quien decide qué día se " +
                                  "acepta es la base.");
                return;
            }
            /* Uno solo también sirve: el que falte se queda en hoy, que es el
               límite que no depende de ninguna configuración -una hora extra
               se pide después de haberla hecho-. */
            if (uno === "") uno = hoy();
            if (otro === "") otro = hoy();

            /* Se ordenan antes de usarlos: cuál de los dos es el mayor lo
               decide la configuración, y si algún día vinieran al revés el
               campo seguiría teniendo un rango con sentido en vez de uno
               imposible. */
            desde = uno < otro ? uno : otro;
            hasta = uno < otro ? otro : uno;

            caja.min = desde;
            caja.max = hasta;
            if (ayuda) {
                ayuda.textContent = "Se puede registrar del " + enTexto(desde) +
                                    " al " + enTexto(hasta) + ".";
            }
        }

        /* Un extremo del plazo, venga como venga.

           Si trae separadores es una FECHA y se usa tal cual -'15/08/2026' o
           '2026-08-15'-: es lo que manda el paquete cuando ya hizo él la
           cuenta, y hacerla dos veces solo sirve para que un día no
           coincidan.

           Si es un número pelado es una CANTIDAD DE DÍAS hacia atrás desde
           hoy, y se convierte aquí. */
        function comoFecha(valor) {
            var texto = String(valor || "").replace(/^\s+|\s+$/g, "");
            var f;

            if (texto === "") return "";
            if (texto.indexOf("/") >= 0 || texto.indexOf("-") >= 0) return enIsoTexto(texto);
            if (!/^\d+$/.test(texto)) return "";

            f = new Date();
            f.setDate(f.getDate() - Number(texto));
            return enIso(f);
        }

        /* La fecha con que se abre un ALTA. Al modificar no se toca: ahí el
           valor lo trajo Obtener y pisarlo sería cambiarle el registro al
           usuario por haber abierto la ventana. */
        function fechaPorOmision() {
            var caja = document.getElementById("datFechaPop");
            var valor = enIsoTexto(ajustes ? ajustes.fechaInicioPop : "");
            var accion = Ventana.valorDe("hdnCodigoAccion");

            if (!caja || valor === "") return;
            if (accion === "U" || accion === "O") return;
            if (caja.value !== "") return;
            caja.value = valor;
        }

        function enTexto(iso) {
            var p = String(iso || "").split("-");
            return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso;
        }

        /* ------------------------------------------------------- el tiempo
           El desplegable va del mínimo al máximo, de múltiplo en múltiplo.
           Las tres cifras son del aplicativo y llegan en el [4]: aquí no hay
           ningún número escrito.

           Con eso, una cantidad que no cuadre no se puede ni teclear, y el
           reparo que la rechazaría no llega a existir. El valor de cada
           opción es el mismo hh:mm con que el paquete escribe el tiempo en la
           grilla -'04:00'- para que la ida y la vuelta hablen igual. */
        function llenarTiempos() {
            var caja = document.getElementById("cboTiempo");
            var paso = ajustes.multiplo;
            var minutos;

            if (!caja) {
                Ventana.registrar("La plantilla de " + TABLA + " no declara el campo Tiempo.");
                return;
            }
            caja.innerHTML = "";
            caja.appendChild(opcion("", "Seleccione"));

            if (paso < 1) {
                Ventana.registrar("La carga de " + TABLA + " no trajo 'multiploMinutos'; " +
                                  "el desplegable del tiempo queda vacío.");
                return;
            }
            for (minutos = paso; minutos <= TOPE; minutos += paso) {
                caja.appendChild(opcion(enHoras(minutos), enHoras(minutos)));
            }
            document.getElementById("ayuTiempo").textContent =
                "De " + enHoras(paso) + " en " + enHoras(paso) +
                ", hasta " + enHoras(TOPE) + ".";
        }

        function opcion(valor, texto) {
            var o = document.createElement("option");
            o.value = valor;
            o.textContent = texto;
            return o;
        }

        /* Minutos a 'hh:mm' con las dos cifras de la hora, como los escribe el
           paquete: '04:00' y no '4:00'. */
        function enHoras(minutos) {
            return dos(Math.floor(minutos / 60)) + ":" + dos(minutos % 60);
        }

        /* El horario, que es de referencia: se muestra para que la persona se
           ubique y no limita lo que puede pedir. */
        function ponerHorario() {
            var caja = document.getElementById("txtHorarioPop");
            if (caja) caja.value = ajustes ? ajustes.horario : "";
        }

        /* --------------------------------------------------------- la tarjeta
           Cuatro cifras, que son las cuatro que manda el paquete:

               totalHoras | horasAprobadas | horasSolicitadas | horasPendientes

           Se pintan con el rótulo que les da el paquete y sin interpretarlas:
           la barra mide lo aprobado sobre el total, que es lo único que se
           puede afirmar sin saber qué cuenta cada una. */
        function pintarResumen(lectura, origen) {
            var caja = document.getElementById("secresumen");
            var cifras = segmentoResumen(lectura, origen, RESUMEN_EN_CARGA).split("|");
            var quien = ubicacionDeSesion();
            var total = cifras[0] || "";
            var aprobadas = cifras[1] || "";
            var solicitadas = cifras[2] || "";
            var pendientes = cifras[3] || "";
            var minutos, hechas;

            if (!caja) return;
            if (total === "") {
                /* Sin resumen no se dibuja una tarjeta en cero: eso diría que
                   su cuenta es cero, que es muy distinto de no saberla. Y si
                   nunca hubo tarjeta, la sección se esconde: un recuadro
                   vacío al lado del filtro se lee como que algo falló al
                   cargar. */
                if (caja.innerHTML === "") caja.hidden = true;
                Ventana.registrar("La respuesta de " + TABLA + " no trajo el resumen.");
                return;
            }
            caja.hidden = false;

            minutos = Grilla.hora.aMinutos(total);
            hechas = Grilla.hora.aMinutos(aprobadas);

            caja.innerHTML =
                '<div class="resumen resumen--cuatro">' +
                    '<div class="resumen__titulo">' + texto(quien.dUbicacion) +
                        '<span class="resumen__periodo">' + rangoEnTexto() + "</span></div>" +
                    '<div class="resumen__cifras">' +
                        dato("Total", total, "") +
                        dato("Aprobadas", aprobadas, "resumen__valor--verde") +
                        dato("Solicitadas", solicitadas, "") +
                        dato("Pendientes", pendientes, "") +
                    "</div>" +
                    '<div class="resumen__barra"><div class="resumen__lleno" id="resumenLleno"></div></div>' +
                "</div>";

            porcentaje("resumenLleno", minutos === 0 ? 0 : Math.min(100, Math.round(hechas * 100 / minutos)));
        }

        /* Lo que la tarjeta está contando. Sin esto, las cifras no dicen de
           qué tramo hablan y cambiarían al consultar sin que se entienda por
           qué. */
        function rangoEnTexto() {
            var desde = Ventana.valorDe("datFechaInicio");
            var hasta = Ventana.valorDe("datFechaFin");
            if (!desde || !hasta) return "Su sección";
            return "Del " + enTexto(desde) + " al " + enTexto(hasta);
        }

        function dato(rotulo, valor, clase) {
            return '<div class="resumen__dato">' +
                       '<div class="resumen__rotulo">' + texto(rotulo) + "</div>" +
                       '<div class="resumen__valor ' + clase + '">' + texto(valor) + "</div>" +
                   "</div>";
        }

        function alConstruir(modelo) {
            modeloPantalla = modelo;
            emparejarFiltroYResumen(TABLA);

            /* La ventana se abre siempre por el mismo sitio -alta, modificar
               y ver terminan en abrirPopup-, y para entonces los controles ya
               tienen sus valores y sus bloqueos. Enganchar ahí evita adivinar
               cuándo llegó la respuesta de Obtener. */
            abrirOriginal = Ventana.abrirPopup;
            Ventana.abrirPopup = function (t, titulo) {
                var salida = abrirOriginal.call(Ventana, t, titulo);
                if (t === TABLA && ajustes) {
                    recortarFecha();
                    fechaPorOmision();
                    ponerHorario();
                }
                return salida;
            };
        }

        /* La carga. El orden importa: primero se lee el [4], porque de ahí
           sale todo lo que se aplica después. */
        function alCargar(lectura) {
            leerAjustes(lectura);
            corregirAyuda(lectura);
            llenarTiempos();
            aplicarFiltro();
            pintarResumen(lectura, "carga");
        }

        /* La consulta contesta pelada: las filas en el [0] y el resumen en el
           [1]. La librería ya repintó la grilla; lo que falta es la tarjeta,
           que tiene que hablar del rango que se acaba de pedir. */
        function alConsultar(lectura) {
            pintarResumen(lectura, "consulta");
        }

        /* Y al grabar, modificar o eliminar: el mensaje, las filas y el
           resumen recalculado. Cada solicitud que entra o sale mueve la
           cuenta, así que la tarjeta y la grilla se rehacen con la misma
           respuesta y sin pedir nada más. */
        function alGestionar(lectura) {
            pintarResumen(lectura, "gestion");
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
