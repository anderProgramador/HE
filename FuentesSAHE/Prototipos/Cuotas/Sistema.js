/* ============================================================================
   SAHE - T01 - Asignación de Cuotas Administrativas
   Sistema.js  -  lo propio de esta ventana.

   Aquí vive lo que solo le pasa a T01: los dos combos de selección múltiple de
   la cabecera, el filtro de la grilla columna por columna, y la regla de que
   la cantidad de meses a replicar se habilita únicamente cuando 'Desea
   replicar' dice que sí.

   Lo que sirve igual en cualquier pantalla —el campo de archivo adjunto, la
   lupa, el formato de números, los avisos— está en la librería general.

   JavaScript nativo, ES5, compatible con Chrome 49. Sin librerías.
   ========================================================================== */
var Sistema = (function () {
    "use strict";

    var el = Comun.el;
    var Adjunto = Comun.Adjunto;

    /* Copia de trabajo: el prototipo graba en memoria para que se pueda ver el
       efecto de replicar sin tocar el arreglo original. */
    var cuotas = Demo.cuotas.slice(0);
    var cboPeriodo = null;
    var cboOficina = null;
    var modo = "I";               /* I alta, U modificación, V solo lectura */
    var enEdicion = null;

    /* ======================================================== MULTICOMBO ==
       Un desplegable de selección múltiple: caja con el resumen y un panel de
       casillas. No se usa <select multiple> porque obliga a arrastrar con la
       tecla control y en una lista de veintiún oficinas eso no se acierta.

       Es de esta pantalla y no de la librería: T01 es la única que ofrece
       elegir varios periodos y varias gerencias a la vez.
       ==================================================================== */
    function MultiCombo(idCaja, lista, vacio, alCambiar) {
        var raiz = el(idCaja);
        var boton, panel, resumen;
        var marcados = {};

        function armar() {
            var html = "", i, id;

            html += "<button type='button' class='multi__caja'>" +
                    "<span class='multi__texto'>" + vacio + "</span>" +
                    "<span class='multi__flecha'>" + Comun.svg("flecha", 14) + "</span></button>";
            html += "<div class='multi__panel'>";
            html += "<label class='multi__opcion multi__opcion--todos'>" +
                    "<input type='checkbox' data-todos='1'> Todos</label>";
            for (i = 0; i < lista.length; i++) {
                id = Comun.texto(lista[i].codigo);
                html += "<label class='multi__opcion'>" +
                        "<input type='checkbox' value='" + id + "'> " +
                        Comun.texto(lista[i].nombre) + "</label>";
            }
            html += "</div>";
            raiz.innerHTML = html;

            boton = raiz.getElementsByTagName("button")[0];
            panel = raiz.getElementsByTagName("div")[0];
            resumen = raiz.getElementsByTagName("span")[0];

            boton.onclick = function (e) {
                (e || window.event).cancelBubble = true;
                alternar();
            };
            panel.onclick = function (e) { (e || window.event).cancelBubble = true; };
            panel.onchange = alMarcar;
        }

        function alternar() {
            var abierto = raiz.className.indexOf("abierto") !== -1;
            cerrarTodos();
            if (!abierto) raiz.className = "multi abierto";
        }

        function cerrar() { raiz.className = "multi"; }

        function alMarcar(e) {
            var origen = (e || window.event).target || (e || window.event).srcElement;
            var cajas = panel.getElementsByTagName("input"), i;

            if (origen.getAttribute("data-todos") === "1") {
                for (i = 1; i < cajas.length; i++) cajas[i].checked = origen.checked;
            }
            marcados = {};
            for (i = 1; i < cajas.length; i++) {
                if (cajas[i].checked) marcados[cajas[i].value] = true;
            }
            /* 'Todos' refleja el estado real: si el usuario destildó uno solo,
               deja de estar marcado. */
            cajas[0].checked = contar() === lista.length && lista.length > 0;
            pintarResumen();
            if (alCambiar) alCambiar();
        }

        function contar() {
            var n = 0, k;
            for (k in marcados) if (marcados.hasOwnProperty(k)) n++;
            return n;
        }

        /* El resumen dice lo elegido cuando cabe y una cuenta cuando no: con
           siete gerencias marcadas, listarlas no entra en la caja. */
        function pintarResumen() {
            var n = contar(), i, unico = "";

            if (n === 0) { resumen.innerHTML = vacio; resumen.className = "multi__texto multi__texto--vacio"; return; }
            resumen.className = "multi__texto";
            if (n === lista.length) { resumen.innerHTML = "Todos (" + n + ")"; return; }
            if (n === 1) {
                for (i = 0; i < lista.length; i++) {
                    if (marcados[lista[i].codigo]) { unico = lista[i].nombre; break; }
                }
                resumen.innerHTML = Comun.texto(unico);
                return;
            }
            resumen.innerHTML = n + " seleccionados";
        }

        function marcar(codigos) {
            var cajas = panel.getElementsByTagName("input"), i;
            marcados = {};
            for (i = 0; i < codigos.length; i++) marcados[codigos[i]] = true;
            for (i = 1; i < cajas.length; i++) cajas[i].checked = marcados[cajas[i].value] === true;
            cajas[0].checked = contar() === lista.length && lista.length > 0;
            pintarResumen();
        }

        /* Sin nada marcado no se filtra: la pantalla muestra todo, que es lo
           que el usuario espera de un filtro en blanco. */
        function acepta(codigo) {
            return contar() === 0 || marcados[codigo] === true;
        }

        function seleccion() {
            var salida = [], i;
            for (i = 0; i < lista.length; i++) {
                if (marcados[lista[i].codigo]) salida.push(lista[i].codigo);
            }
            return salida;
        }

        armar();
        pintarResumen();
        return { marcar: marcar, acepta: acepta, seleccion: seleccion, cerrar: cerrar };
    }

    /* Solo un panel abierto a la vez, y cualquier clic afuera los cierra. */
    function cerrarTodos() {
        if (cboPeriodo) cboPeriodo.cerrar();
        if (cboOficina) cboOficina.cerrar();
    }

    /* ============================================================ GRILLA == */

    /* Un filtro por columna. Los de texto comparan por subcadena; el de
       adjunto es un desplegable porque la celda muestra un icono y no hay
       texto contra el cual escribir. */
    function filtros() {
        return {
            periodo: el("fPeriodo").value.toLowerCase(),
            codigo: el("fCodigo").value.toLowerCase(),
            gerencia: el("fGerencia").value.toLowerCase(),
            horas: el("fHoras").value.toLowerCase(),
            adjunto: el("fAdjunto").value
        };
    }

    function visibles() {
        var f = filtros(), salida = [], i, c, nombre, conDoc;

        for (i = 0; i < cuotas.length; i++) {
            c = cuotas[i];
            nombre = Demo.nombreOficina(c.codigo).toLowerCase();
            conDoc = Adjunto.deTrama(c.adjunto) !== "";

            if (!cboPeriodo.acepta(c.periodo)) continue;
            if (!cboOficina.acepta(c.codigo)) continue;
            if (f.periodo !== "" && c.periodo.toLowerCase().indexOf(f.periodo) === -1) continue;
            if (f.codigo !== "" && c.codigo.toLowerCase().indexOf(f.codigo) === -1) continue;
            if (f.gerencia !== "" && nombre.indexOf(f.gerencia) === -1) continue;
            if (f.horas !== "" &&
                String(c.horas).indexOf(f.horas) === -1 &&
                Comun.formatear(c.horas).indexOf(f.horas) === -1) continue;
            if (f.adjunto === "C" && !conDoc) continue;
            if (f.adjunto === "S" && conDoc) continue;
            salida.push(c);
        }
        return salida;
    }

    function pintar() {
        var lista = visibles(), html = "", i, c, total = 0;

        for (i = 0; i < lista.length; i++) {
            c = lista[i];
            total += c.horas;
            html += "<tr data-id='" + Comun.texto(c.id) + "'>" +
                    "<td>" + Comun.texto(c.periodo) + "</td>" +
                    "<td>" + Comun.texto(c.codigo) + "</td>" +
                    "<td>" + Comun.texto(Demo.nombreOficina(c.codigo)) + "</td>" +
                    "<td class='der'>" + Comun.formatear(c.horas) + "</td>" +
                    "<td class='cen'>" + Adjunto.celda(c.adjunto) + "</td>" +
                    "<td class='cen'>" +
                        "<button type='button' class='boton-fila' data-accion='editar' title='Modificar'>" +
                        Comun.svg("editar", 15) + "</button>" +
                        "<button type='button' class='boton-fila' data-accion='ver' title='Ver'>" +
                        Comun.svg("ver", 15) + "</button>" +
                    "</td></tr>";
        }
        if (html === "") html = "<tr class='sin-datos'><td colspan='6'>No hay cuotas que coincidan con la selección.</td></tr>";

        el("cuerpo").innerHTML = html;
        el("cuenta").innerHTML = String(lista.length);
        el("total").innerHTML = Comun.formatear(total);
    }

    function limpiarFiltros() {
        el("fPeriodo").value = "";
        el("fCodigo").value = "";
        el("fGerencia").value = "";
        el("fHoras").value = "";
        el("fAdjunto").value = "";
        pintar();
    }

    /* ======================================================== REPLICACIÓN ==
       La cantidad de meses se ve siempre: esconderla haría que la ventana
       cambiara de alto al elegir 'Sí' y que el usuario no supiera de antemano
       que ese dato existe. Se habilita solo cuando se pide replicar; mientras
       tanto queda apagada y en blanco, para que no viaje un número que el
       usuario ya descartó.
       ==================================================================== */
    function tope() { return Demo.mesesQueQuedan(el("mPeriodo").value); }

    function refrescarReplica() {
        var quiere = el("mReplica").value === "S";
        var editable = modo !== "V";
        var limite = tope();
        var cuantos, lista, html = "", i;

        el("mMeses").disabled = !quiere || !editable;
        el("mMeses").setAttribute("max", String(limite));

        if (!quiere) {
            el("mMeses").value = "";
            el("errMeses").innerHTML = "";
            el("cajaReplica").className = "replica oculto";
            return;
        }

        /* Diciembre no tiene meses por delante. */
        if (limite === 0) {
            el("mMeses").value = "";
            el("mMeses").disabled = true;
            el("cajaReplica").className = "replica";
            el("resumenReplica").innerHTML =
                "<b>" + Demo.nombrePeriodo(el("mPeriodo").value) + "</b> es el último periodo " +
                "del año: no queda ningún mes al que copiar la cuota.";
            return;
        }

        if (el("mMeses").value === "") el("mMeses").value = String(limite);
        cuantos = Math.min(Math.max(Number(el("mMeses").value) || 0, 0), limite);
        lista = Demo.periodosSiguientes(el("mPeriodo").value, cuantos);
        for (i = 0; i < lista.length; i++) {
            html += "<span class='periodo-chip periodo-chip--nuevo'>" + Demo.nombrePeriodo(lista[i]) + "</span>";
        }
        el("cajaReplica").className = "replica";
        el("resumenReplica").innerHTML =
            "Quedan <b>" + limite + "</b> " + (limite === 1 ? "mes" : "meses") + " en el año. " +
            (cuantos === 0
                ? "Indique a cuántos copiar la cuota."
                : "La misma cuota se creará en <b>" + cuantos + "</b> " +
                  (cuantos === 1 ? "periodo" : "periodos") + ":") +
            "<div class='periodos'>" + html + "</div>";
    }

    function revisarReplica() {
        var limite = tope(), n;
        if (el("mReplica").value !== "S") return "";
        if (limite === 0) return "No quedan meses en el año a los que replicar.";
        if (String(el("mMeses").value).replace(/^\s+|\s+$/g, "") === "") return "Indique a cuántos meses replicar.";
        n = Number(el("mMeses").value);
        if (isNaN(n) || n !== Math.round(n) || n < 1) return "La cantidad de meses debe ser un entero mayor que cero.";
        if (n > limite) return "Solo quedan " + limite + " " + (limite === 1 ? "mes" : "meses") + " en el año.";
        return "";
    }

    function revisarHoras(valor) {
        var n;
        if (String(valor).replace(/^\s+|\s+$/g, "") === "") return "Indique la cantidad de horas.";
        n = Number(valor);
        if (isNaN(n)) return "La cantidad de horas debe ser un número.";
        if (n !== Math.round(n)) return "La cuota se asigna en horas enteras.";
        if (n <= 0) return "La cuota debe ser mayor que cero.";
        if (n > 999999) return "La cuota no puede pasar de 999,999 horas.";
        return "";
    }

    /* ========================================================== VENTANA == */

    function abrir(titulo) {
        el("tituloMant").innerHTML = titulo;
        el("veloMant").className = "velo abierto";
        limpiarErrores();
    }

    function cerrar() { el("veloMant").className = "velo"; }

    function limpiarErrores() {
        var ids = ["errOficina", "errHoras", "errMeses", "errMotivo"], i;
        for (i = 0; i < ids.length; i++) el(ids[i]).innerHTML = "";
    }

    function nuevo() {
        modo = "I";
        enEdicion = null;
        el("mPeriodo").value = periodoPropuesto();
        el("mCodigo").value = "";
        el("mNombre").value = "";
        el("mHoras").value = "";
        el("mReplica").value = "N";
        el("mMeses").value = "";
        el("mMotivo").value = "";
        el("cuentaMotivo").innerHTML = "0 / 250";
        Adjunto.poner("mAdjunto", "");
        el("resumenMant").className = "resumen-cabecera oculto";
        el("filaMotivo").className = "fila oculto";
        habilitar(true);
        refrescarReplica();
        abrir("Nuevo");
        el("mPeriodo").focus();
    }

    /* El periodo con que se abre el alta: el único elegido en la cabecera si
       hay uno solo, y si no el periodo en curso. */
    function periodoPropuesto() {
        var elegidos = cboPeriodo.seleccion();
        return elegidos.length === 1 ? elegidos[0] : Demo.periodoActual;
    }

    /* Modificar: el periodo y la gerencia son la llave del registro y no se
       tocan. Se cambian las horas, la replicación, el documento y el motivo,
       que es lo que el histórico necesita para explicarse. */
    function editar(id, soloLectura) {
        var c = porId(id);
        if (!c) return;

        modo = soloLectura ? "V" : "U";
        enEdicion = c;
        el("mPeriodo").value = c.periodo;
        el("mCodigo").value = c.codigo;
        el("mNombre").value = Demo.nombreOficina(c.codigo);
        el("mHoras").value = String(c.horas);
        el("mReplica").value = "N";
        el("mMeses").value = "";
        el("mMotivo").value = "";
        el("cuentaMotivo").innerHTML = "0 / 250";
        Adjunto.poner("mAdjunto", c.adjunto);
        el("filaMotivo").className = soloLectura ? "fila oculto" : "fila";
        el("resumenMant").className = "resumen-cabecera";
        el("resumenMant").innerHTML =
            "Cuota vigente de <b>" + Comun.texto(Demo.nombreOficina(c.codigo)) + "</b> en <b>" +
            Demo.nombrePeriodo(c.periodo) + "</b>: <b>" + Comun.formatear(c.horas) + "</b> horas.";
        habilitar(!soloLectura);
        refrescarReplica();
        abrir(soloLectura ? "Ver" : "Modificar");
        if (!soloLectura) el("mHoras").focus();
    }

    /* En alta se elige periodo y oficina; en modificación no. En solo lectura
       no se toca nada y el botón Grabar ni aparece. */
    function habilitar(editable) {
        var deAlta = modo === "I";

        el("mPeriodo").disabled = !deAlta || !editable;
        el("mCodigo").disabled = !deAlta || !editable;
        el("btnLupaOfi").disabled = !deAlta || !editable;
        el("btnLupaOfi").className = (!deAlta || !editable) ? "lupa lupa--apagada" : "lupa";
        el("mHoras").disabled = !editable;
        el("mReplica").disabled = !editable;
        el("mMotivo").disabled = !editable;
        Adjunto.habilitar("mAdjunto", "btnAdjunto", editable);
        el("btnGrabar").className = editable ? "boton boton--primario" : "boton boton--primario oculto";
        el("btnCancelarMant").innerHTML = editable ? "Cancelar" : "Cerrar";
    }

    function porId(id) {
        var i;
        for (i = 0; i < cuotas.length; i++) if (cuotas[i].id === id) return cuotas[i];
        return null;
    }

    /* Las oficinas que ya tienen cuota en el periodo del alta: la lupa las
       muestra pero no deja elegirlas. */
    function ocupadasEn(periodo) {
        var mapa = {}, i;
        for (i = 0; i < cuotas.length; i++) {
            if (cuotas[i].periodo === periodo) mapa[cuotas[i].codigo] = true;
        }
        return mapa;
    }

    /* ============================================================ GRABAR == */

    /* La trama de la cabecera, en el orden que espera el paquete:
           accion | periodo | oficina | horas | replica | meses | adjunto | motivo
       El adjunto lo prepara la librería general: viaja el nombre, y 'S/R'
       cuando la cuota no tiene documento. */
    function trama() {
        return [
            modo,
            el("mPeriodo").value,
            el("mCodigo").value,
            el("mHoras").value,
            el("mReplica").value,
            el("mReplica").value === "S" ? el("mMeses").value : "0",
            Adjunto.paraTrama(Adjunto.nombre("mAdjunto")),
            el("mMotivo").value
        ].join("|");
    }

    function grabar() {
        var problema, meses, lista, mensaje, periodo = el("mPeriodo").value;

        limpiarErrores();

        if (modo === "I") {
            if (el("mCodigo").value === "" || el("mNombre").value === "") {
                el("errOficina").innerHTML = "Elija la oficina.";
                el("mCodigo").focus();
                return;
            }
            if (Demo.tieneCuota(periodo, el("mCodigo").value)) {
                el("errOficina").innerHTML = "Esa gerencia ya tiene cuota en " + Demo.nombrePeriodo(periodo) + ".";
                return;
            }
        }

        problema = revisarHoras(el("mHoras").value);
        if (problema !== "") { el("errHoras").innerHTML = problema; el("mHoras").focus(); return; }

        problema = revisarReplica();
        if (problema !== "") { el("errMeses").innerHTML = problema; el("mMeses").focus(); return; }

        if (modo === "U" && el("mMotivo").value.replace(/^\s+|\s+$/g, "") === "") {
            el("errMotivo").innerHTML = "Indique el motivo del cambio.";
            el("mMotivo").focus();
            return;
        }

        meses = el("mReplica").value === "S" ? Number(el("mMeses").value) : 0;
        lista = Demo.periodosSiguientes(periodo, meses);

        if (modo === "I") {
            cuotas.push({
                id: "n" + (cuotas.length + 1),
                periodo: periodo,
                codigo: el("mCodigo").value,
                horas: Number(el("mHoras").value),
                adjunto: Adjunto.nombre("mAdjunto")
            });
            mensaje = "Se registró la cuota de " + Comun.texto(el("mNombre").value) + ".";
        } else {
            enEdicion.horas = Number(el("mHoras").value);
            enEdicion.adjunto = Adjunto.nombre("mAdjunto");
            mensaje = "Se actualizó la cuota de " + Comun.texto(el("mNombre").value) + ".";
        }
        if (lista.length > 0) {
            mensaje += " Se replicó en " + lista.length + " " +
                       (lista.length === 1 ? "periodo" : "periodos") + ": " + lista.join(", ") + ".";
        }
        /* El prototipo muestra la trama para poder revisarla contra el
           paquete; en el aplicativo esto no se ve. */
        mensaje += "<div class='trama'>data = T01¬" + Comun.texto(trama()) + "</div>";

        cerrar();
        pintar();
        Comun.avisar("avisoPrincipal", "ok", mensaje);
    }

    /* ========================================================== ARRANQUE == */

    function iniciar() {
        document.body.insertAdjacentHTML("beforeend", Comun.htmlLupa());
        Comun.armarLupa();

        el("btnExcel").innerHTML = Comun.svg("excel", 15) + "Exportar";
        el("btnNuevo").innerHTML = Comun.svg("mas", 15) + "Nuevo";
        el("btnLupaOfi").innerHTML = Comun.svg("buscar", 16);

        armarCombos();
        armarPeriodosDelPopup();
        armarMotivos();
        Adjunto.armar("mAdjunto", "btnAdjunto");

        el("fPeriodo").oninput = pintar;
        el("fCodigo").oninput = pintar;
        el("fGerencia").oninput = pintar;
        el("fHoras").oninput = pintar;
        el("fAdjunto").onchange = pintar;
        el("btnLimpiar").onclick = limpiarFiltros;

        el("btnNuevo").onclick = nuevo;
        el("btnCerrarMant").onclick = cerrar;
        el("btnCancelarMant").onclick = cerrar;
        el("btnGrabar").onclick = grabar;
        el("btnExcel").onclick = function () {
            Comun.avisar("avisoPrincipal", "ok", "Se generó el archivo AsignacionCuotas.xlsx.");
        };

        /* La regla propia de T01: la cantidad de meses se ve siempre y se
           habilita solo con 'Sí'. Cambiar el periodo también la recalcula,
           porque el tope depende del mes. */
        el("mReplica").onchange = refrescarReplica;
        el("mMeses").oninput = refrescarReplica;
        el("mPeriodo").onchange = refrescarReplica;

        el("btnLupaOfi").onclick = function () {
            if (this.disabled) return;
            Comun.abrirLupa(function (codigo, nombre) {
                el("mCodigo").value = codigo;
                el("mNombre").value = nombre;
                el("errOficina").innerHTML = "";
                el("mHoras").focus();
            }, ocupadasEn(el("mPeriodo").value));
        };

        el("mMotivo").oninput = function () {
            el("cuentaMotivo").innerHTML = this.value.length + " / 250";
        };

        /* Un solo manejador para toda la grilla: con treinta filas y tres
           botones cada una, poner uno por botón sería pagar de más. */
        el("cuerpo").onclick = function (e) {
            var nodo = e.target || e.srcElement, fila, accion;

            while (nodo && nodo !== this && !(nodo.getAttribute && nodo.getAttribute("data-accion"))) {
                nodo = nodo.parentNode;
            }
            if (!nodo || nodo === this) return;
            accion = nodo.getAttribute("data-accion");

            if (accion === "abrirAdjunto") {
                Comun.avisar("avisoPrincipal", "ok",
                    "Se descargaría el documento " + Comun.texto(nodo.getAttribute("data-archivo")) + ".");
                return;
            }
            fila = nodo;
            while (fila && fila.tagName !== "TR") fila = fila.parentNode;
            if (!fila) return;
            editar(fila.getAttribute("data-id"), accion === "ver");
        };

        el("veloMant").onclick = function (e) {
            if ((e.target || e.srcElement) === this) cerrar();
        };

        /* Cualquier clic fuera de los combos los cierra. */
        document.onclick = cerrarTodos;

        /* De entrada se muestra el periodo en curso, que es lo que el usuario
           viene a ver; los demás quedan a un clic. */
        cboPeriodo.marcar([Demo.periodoActual]);
        pintar();
    }

    function armarCombos() {
        cboPeriodo = MultiCombo("cboPeriodo", Demo.periodos(), "Todos los periodos", pintar);
        cboOficina = MultiCombo("cboOficina", Demo.oficinas, "Todas las gerencias", pintar);
    }

    function armarPeriodosDelPopup() {
        var lista = Demo.periodos(), html = "", i;
        for (i = 0; i < lista.length; i++) {
            html += "<option value='" + Comun.texto(lista[i].codigo) + "'>" +
                    Comun.texto(lista[i].nombre) + "</option>";
        }
        el("mPeriodo").innerHTML = html;
        el("mPeriodo").value = Demo.periodoActual;
    }

    function armarMotivos() {
        var html = "", i;
        for (i = 0; i < Demo.motivos.length; i++) {
            html += "<option value='" + Comun.texto(Demo.motivos[i]) + "'></option>";
        }
        el("listaMotivos").innerHTML = html;
    }

    return { iniciar: iniciar };
})();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { Sistema.iniciar(); }, false);
} else {
    Sistema.iniciar();
}
