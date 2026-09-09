/* =========================================================================
   El cuerpo de la pantalla cuando la oficina se elige DESDE LA CABECERA.

   Los tres prototipos D, E y F se diferencian solo en el gesto con que se
   cambia de oficina; lo que hay debajo -el saldo, la grilla, la ventana de
   mantenimiento- es siempre lo mismo, así que vive aquí una sola vez.

   La idea que comparten: la oficina deja de ser un campo de la pantalla y
   pasa a ser el CONTEXTO de la sesión, como el perfil. Mientras esté puesta,
   toda la pantalla habla de esa oficina y de ninguna otra.
   ========================================================================= */
var Cuerpo = (function () {
    "use strict";

    var Cuerpo = {};
    var activa = null;
    var conCintillo = true;
    var enEdicion = null;

    /* Lo llama el prototipo para enterarse del cambio y repintar su propia
       cabecera -las cifras del menú, de la cinta o del chip-. */
    Cuerpo.alCambiar = null;

    /* --------------------------------------------------------- armado --- */

    /* 'conCintillo' en false esconde la línea de saldo que va sobre la
       grilla. Se usa cuando la pantalla ya muestra el saldo de otra forma
       -la tarjeta de resumen-: repetir la misma cifra dos veces en la misma
       pantalla no informa, ensucia. */
    Cuerpo.montar = function (idContenedor, verCintillo) {
        var caja = Fun.porId(idContenedor);
        conCintillo = verCintillo !== false;
        caja.innerHTML =
            '<div class="cintillo" id="cCintillo"></div>' +
            '<div class="barra">' +
                '<div class="barra__titulo">Reparto de <span id="cTitulo"></span></div>' +
                '<div class="barra__cuenta">Registros: <b id="cCuenta">0</b></div>' +
                '<button type="button" class="boton boton--secundario" id="cExcel">Exportar</button>' +
                '<button type="button" class="boton boton--primario" id="cNuevo">Nuevo</button>' +
            '</div>' +
            '<div class="rejilla"><table class="tabla">' +
                '<thead><tr>' +
                    '<th class="col-periodo">Periodo</th>' +
                    '<th class="col-codigo">Código Oficina</th>' +
                    '<th>Oficina</th>' +
                    '<th class="der col-horas">Horas Asignadas</th>' +
                    '<th class="cen col-pdf">Adjunto</th>' +
                    '<th class="cen col-accion">Acciones</th>' +
                '</tr></thead>' +
                '<tbody id="cCuerpo"></tbody>' +
                '<tfoot><tr><td colspan="3">Repartido de esta cuota</td>' +
                    '<td class="der" id="cTotal">0:00</td><td colspan="2"></td></tr></tfoot>' +
            '</table></div>';

        document.body.appendChild(ventana());
        Fun.porId("cNuevo").onclick = function () { abrir(null); };
        Fun.porId("vCerrar").onclick = cerrar;
        Fun.porId("vCancelar").onclick = cerrar;
        Fun.porId("vGrabar").onclick = grabar;
        Fun.porId("vHoras").oninput = function () { Fun.limpiarHora(this); };
    };

    function ventana() {
        var velo = Fun.crear("div", "velo");
        velo.id = "vVelo";
        velo.innerHTML =
            '<div class="ventana">' +
                '<div class="ventana__barra">' +
                    '<div class="ventana__titulo" id="vTitulo">Nuevo reparto</div>' +
                    '<button type="button" class="ventana__cerrar" id="vCerrar" title="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="ventana__cuerpo">' +
                    '<div class="cintillo" id="vCintillo"></div>' +
                    '<div class="fila">' +
                        '<div class="campo campo--corto">' +
                            '<label class="campo__etiqueta" for="vCodigo">Código Oficina<span class="campo__obligatorio">*</span></label>' +
                            '<select class="control" id="vCodigo"></select>' +
                        '</div>' +
                        '<div class="campo campo--corto">' +
                            '<label class="campo__etiqueta" for="vHoras">Horas a asignar<span class="campo__obligatorio">*</span></label>' +
                            '<input type="text" class="control control--numero" id="vHoras" maxlength="8" placeholder="hh:mm">' +
                            '<div class="campo__ayuda" id="vAyuda"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="campo__error" id="vError"></div>' +
                '</div>' +
                '<div class="pie-acciones">' +
                    '<div class="pie-acciones__nota">La oficina de origen es la que está elegida arriba.</div>' +
                    '<button type="button" class="boton boton--secundario" id="vCancelar">Cancelar</button>' +
                    '<button type="button" class="boton boton--primario" id="vGrabar">Grabar</button>' +
                '</div>' +
            '</div>';
        return velo;
    }

    /* -------------------------------------------------- cambio de oficina - */

    /* El único punto por donde se cambia de contexto. Los tres prototipos
       terminan llamando aquí: uno desde un desplegable, otro desde una cinta
       de pestañas y el tercero desde la ventana de bienvenida. */
    Cuerpo.ir = function (codigo) {
        activa = codigo;
        pintar();
        if (typeof Cuerpo.alCambiar === "function") Cuerpo.alCambiar(Fun.bolsaDe(codigo));
    };

    Cuerpo.activa = function () { return Fun.bolsaDe(activa); };

    /* ------------------------------------------------------- la grilla --- */

    function pintar() {
        var bolsa = Fun.bolsaDe(activa);
        var s = Fun.saldo(bolsa);
        var cuerpo = Fun.porId("cCuerpo"), n = 0, i, fila;

        Fun.porId("cTitulo").textContent = bolsa.nombre;
        Fun.porId("cCintillo").className = "cintillo" +
            (s.excedida ? " cintillo--excedido" : "") + (conCintillo ? "" : " oculto");
        Fun.porId("cCintillo").innerHTML =
            "Cuota de <b>" + bolsa.nombre + "</b> — asignada <b>" + Fun.formatear(s.asignada) +
            "</b>, repartida <b>" + Fun.formatear(s.repartida) +
            "</b>, <b>pendiente " + Fun.conSigno(s.pendiente) + "</b>";

        cuerpo.innerHTML = "";
        for (i = 0; i < Fun.reparto.length; i++) {
            if (Fun.reparto[i].bolsa !== activa) continue;
            cuerpo.appendChild(filaDe(Fun.reparto[i]));
            n++;
        }
        if (n === 0) {
            fila = Fun.crear("tr", "sin-datos");
            fila.appendChild(Fun.crear("td", "", "Esta cuota todavía no se ha repartido.")).colSpan = 6;
            cuerpo.appendChild(fila);
        }
        Fun.porId("cCuenta").textContent = n;
        Fun.porId("cTotal").textContent = Fun.formatear(s.repartida);
    }

    Cuerpo.pintar = pintar;

    function filaDe(linea) {
        var tr = document.createElement("tr"), td;
        tr.appendChild(Fun.crear("td", "", Fun.periodo));
        tr.appendChild(Fun.crear("td", "", linea.codigo));
        tr.appendChild(Fun.crear("td", "", linea.nombre));
        tr.appendChild(Fun.crear("td", "der", linea.horas));

        td = Fun.crear("td", "cen");
        td.innerHTML = '<button type="button" class="boton-fila"' +
            (linea.adjunto === "S/R" ? " disabled" : "") + ' title="' +
            (linea.adjunto === "S/R" ? "Sin documento" : linea.adjunto) + '">' + Fun.iconos.pdf + "</button>";
        tr.appendChild(td);

        td = Fun.crear("td", "cen");
        td.innerHTML = '<button type="button" class="boton-fila" title="Editar">' + Fun.iconos.editar + "</button>" +
                       '<button type="button" class="boton-fila" title="Eliminar">' + Fun.iconos.eliminar + "</button>";
        td.firstChild.onclick = function () { abrir(linea); };
        td.lastChild.onclick = function () { quitar(linea); };
        tr.appendChild(td);
        return tr;
    }

    function quitar(linea) {
        var i;
        for (i = 0; i < Fun.reparto.length; i++) {
            if (Fun.reparto[i].id === linea.id) { Fun.reparto.splice(i, 1); break; }
        }
        Cuerpo.ir(activa);
    }

    /* ------------------------------------------------------- la ventana -- */

    function abrir(linea) {
        var bolsa = Fun.bolsaDe(activa);
        var s = Fun.saldo(bolsa);
        var libres = s.pendiente + (linea ? Fun.aMinutos(linea.horas) : 0);
        var sel = Fun.porId("vCodigo"), lista = Fun.dependientes[activa], i;

        enEdicion = linea || null;
        Fun.porId("vTitulo").textContent = linea ? "Modificar reparto" : "Nuevo reparto";
        Fun.porId("vCintillo").innerHTML =
            "Se descuenta de <b>" + bolsa.nombre + "</b>" +
            '<div class="cintillo__pie">Disponible para esta línea: <b>' + Fun.conSigno(libres) + "</b></div>";
        Fun.porId("vAyuda").textContent = "Máximo " + Fun.conSigno(libres) + " (hh:mm)";

        sel.innerHTML = "";
        sel.appendChild(new Option("Seleccione", ""));
        for (i = 0; i < lista.length; i++) {
            sel.appendChild(new Option(lista[i].codigo + " - " + lista[i].nombre, lista[i].codigo));
        }
        sel.value = linea ? linea.codigo : "";
        sel.disabled = !!linea;
        Fun.porId("vHoras").value = linea ? linea.horas : "";
        Fun.porId("vError").textContent = "";
        Fun.porId("vVelo").className = "velo abierto";
    }

    function cerrar() { Fun.porId("vVelo").className = "velo"; }

    function grabar() {
        var bolsa = Fun.bolsaDe(activa);
        var s = Fun.saldo(bolsa);
        var codigo = Fun.porId("vCodigo").value;
        var minutos = Fun.aMinutos(Fun.porId("vHoras").value);
        var libres = s.pendiente + (enEdicion ? Fun.aMinutos(enEdicion.horas) : 0);
        var lista = Fun.dependientes[activa], nombre = "", i;

        if (!codigo) { Fun.porId("vError").textContent = "Indique la oficina."; return; }
        if (minutos === 0) { Fun.porId("vError").textContent = "Indique las horas en hh:mm."; return; }
        if (minutos > libres) {
            Fun.porId("vError").textContent =
                "Solo quedan " + Fun.conSigno(libres) + " en la cuota de " + bolsa.nombre + ".";
            return;
        }
        for (i = 0; i < lista.length; i++) if (lista[i].codigo === codigo) nombre = lista[i].nombre;

        if (enEdicion) enEdicion.horas = Fun.formatear(minutos);
        else Fun.reparto.push({
            id: new Date().getTime(), bolsa: activa, codigo: codigo,
            nombre: nombre, horas: Fun.formatear(minutos), adjunto: "S/R"
        });
        cerrar();
        Cuerpo.ir(activa);
    }

    return Cuerpo;
})();
