/* ============================================================================
   SAHE - T17  El detalle de conceptos, compartido por los prototipos D, E y F.

   Es el mismo comportamiento en los tres: la disposición cambia, las reglas
   no. Se separa para que comparar los prototipos sea comparar diseños y no
   tres copias de la misma lógica.

   Espera encontrar en la página, con estos ids:
       cuerpoDetalle  spnCuenta  totAnterior  totNuevo  [totDif]
       txtFechaCambio errFechaCambio  btnAgregar btnFecha btnGrabar
       cboNuevoConcepto numNuevoImporte veloAgregar
       btnConfirmarAgregar btnCancelarAgregar btnCerrarAgregar
       avisoMod

   JavaScript nativo, ES5, compatible con Chrome 49.
   ========================================================================== */
var Detalle = (function () {
    "use strict";

    var filas = [];
    var opciones = {};
    var el = Comun.el;

    /* ---------------------------------------------------------- pintado -- */

    function pintar() {
        var cuerpo = el("cuerpoDetalle"), html = "", i, f, c;

        for (i = 0; i < filas.length; i++) {
            f = filas[i];
            c = Demo.conceptoDe(f.t16);
            html += "<tr data-fila='" + i + "'>" +
                "<td>" + c.codigo + "</td>" +
                "<td>" + c.nombre + "</td>" +
                "<td class='der tenue'>" + Demo.moneda(f.anterior) + "</td>" +
                "<td class='der'><input type='number' class='control' min='0' step='0.01' " +
                    "data-importe='" + i + "' value='" + Demo.aNumero(f.nuevo).toFixed(2) + "'></td>" +
                "<td class='cen'><input type='date' class='control' data-fecha='" + i + "' " +
                    "max='" + Demo.hoyISO() + "' value='" + f.fecha + "'></td>" +
                "<td class='cen'><button type='button' class='boton-fila' data-quitar='" + i +
                    "' title='Quitar'>" + Comun.svg("quitar", 15) + "</button></td>" +
                "</tr>";
        }
        if (filas.length === 0) {
            html = "<tr class='sin-datos'><td colspan='6'>El trabajador no tiene conceptos asignados.</td></tr>";
        }
        cuerpo.innerHTML = html;
        if (el("spnCuenta")) el("spnCuenta").innerHTML = String(filas.length);
        pintarTotales();
        marcarCambiados();
    }

    function pintarTotales() {
        var suma = Demo.totales(filas);
        var dif = suma.nuevo - suma.anterior;

        el("totAnterior").innerHTML = Demo.moneda(suma.anterior);
        el("totNuevo").innerHTML = Demo.moneda(suma.nuevo);
        if (el("totDif")) {
            el("totDif").innerHTML = (dif > 0 ? "+" : "") + Demo.moneda(dif);
            el("totDif").className = "der " + (dif > 0 ? "sube" : (dif < 0 ? "baja" : "tenue"));
        }
    }

    /* Se resalta lo que cambió: en ocho filas donde solo se tocó una, el
       usuario necesita ver cuál antes de grabar. */
    function marcarCambiados() {
        var entradas = el("cuerpoDetalle").querySelectorAll("[data-importe]");
        var i, j, clase, cuantos = 0, chip = el("chipCambios");

        for (i = 0; i < entradas.length; i++) {
            j = Number(entradas[i].getAttribute("data-importe"));
            clase = "control";
            if (Demo.aNumero(entradas[i].value) !== Demo.aNumero(filas[j].anterior)) {
                clase += " control--cambiado";
                cuantos++;
            }
            entradas[i].className = clase;
        }
        if (!chip) return;
        if (cuantos === 0) { chip.className = "chip oculto"; return; }
        chip.className = "chip";
        chip.innerHTML = cuantos === 1 ? "1 cambio" : cuantos + " cambios";
    }

    /* ---------------------------------------------------------- eventos -- */

    function alEscribir(evento) {
        var e = evento || window.event;
        var origen = e.target || e.srcElement;
        var indice, mensaje;

        if (!origen || !origen.getAttribute) return;

        indice = origen.getAttribute("data-importe");
        if (indice !== null) {
            filas[+indice].nuevo = Demo.aNumero(origen.value);
            pintarTotales();
            marcarCambiados();
            return;
        }

        indice = origen.getAttribute("data-fecha");
        if (indice !== null) {
            /* El valor se guarda aunque esté mal: si solo se guardara el
               bueno, la fila conservaría la fecha vieja, Grabar la daría por
               válida y se registraría una fecha que el usuario ya cambió. */
            filas[+indice].fecha = origen.value;
            mensaje = Comun.revisarFecha(origen.value);
            Comun.marcarFecha(origen, mensaje);
        }
    }

    function alPulsar(evento) {
        var e = evento || window.event;
        var nodo = e.target || e.srcElement, indice;

        while (nodo && nodo.getAttribute && nodo.getAttribute("data-quitar") === null) nodo = nodo.parentNode;
        if (!nodo || !nodo.getAttribute) return;
        indice = Number(nodo.getAttribute("data-quitar"));
        if (window.confirm("¿Quita el concepto " + Demo.conceptoDe(filas[indice].t16).nombre + "?")) {
            filas.splice(indice, 1);
            pintar();
        }
    }

    /* ---------------------------------------------------------- agregar -- */

    function disponibles() {
        var usados = {}, salida = [], i;
        for (i = 0; i < filas.length; i++) usados[filas[i].t16] = true;
        for (i = 0; i < Demo.conceptos.length; i++) {
            if (!usados[Demo.conceptos[i].id]) salida.push(Demo.conceptos[i]);
        }
        return salida;
    }

    function abrirAgregar() {
        var lista = disponibles(), cbo = el("cboNuevoConcepto"), i, op;

        if (lista.length === 0) { avisar("El trabajador ya tiene todos los conceptos vigentes.", "alerta"); return; }
        cbo.innerHTML = "";
        for (i = 0; i < lista.length; i++) {
            op = document.createElement("option");
            op.value = lista[i].id;
            op.appendChild(document.createTextNode(lista[i].codigo + " - " + lista[i].nombre));
            cbo.appendChild(op);
        }
        el("numNuevoImporte").value = "0.00";
        el("veloAgregar").className = "velo abierto";
    }

    function confirmarAgregar() {
        filas.push({
            t17: "0", t16: el("cboNuevoConcepto").value, anterior: 0,
            nuevo: Demo.aNumero(el("numNuevoImporte").value),
            fecha: el("txtFechaCambio").value || Demo.hoyISO()
        });
        el("veloAgregar").className = "velo";
        pintar();
        avisar("", "");
    }

    /* La fecha suele ser la misma para todo el movimiento; escribirla ocho
       veces no le sirve a nadie. */
    function aplicarFechaATodos() {
        var fecha = el("txtFechaCambio").value;
        var mensaje = Comun.revisarFecha(fecha), i;

        el("errFechaCambio").innerHTML = mensaje;
        if (mensaje !== "") { el("txtFechaCambio").focus(); return; }
        for (i = 0; i < filas.length; i++) filas[i].fecha = fecha;
        pintar();
        avisar("La fecha " + fecha + " quedó en los " + filas.length + " conceptos.", "ok");
    }

    function avisar(texto, tipo) {
        var caja = el("avisoMod");
        if (!caja) return;
        if (!texto) { caja.className = "aviso oculto"; return; }
        caja.className = "aviso aviso--" + tipo;
        caja.innerHTML = texto;
    }

    /* ----------------------------------------------------------- grabar -- */

    function grabar() {
        var mensaje = Comun.revisarFecha(el("txtFechaCambio").value), i, problema;

        el("errFechaCambio").innerHTML = mensaje;
        if (mensaje !== "") { el("txtFechaCambio").focus(); return; }

        for (i = 0; i < filas.length; i++) {
            problema = Comun.revisarFecha(filas[i].fecha);
            if (problema !== "") { avisar("Fila " + (i + 1) + ": " + problema, "error"); return; }
        }
        if (filas.length === 0) { avisar("Agregue al menos un concepto.", "alerta"); return; }

        avisar("", "");
        if (typeof opciones.alGrabar === "function") opciones.alGrabar(filas);
    }

    /* --------------------------------------------------------- interfaz -- */

    function cargar(nuevas) {
        filas = nuevas || [];
        avisar("", "");
        pintar();
    }

    function iniciar(config) {
        opciones = config || {};

        el("cuerpoDetalle").oninput = alEscribir;
        el("cuerpoDetalle").onchange = alEscribir;
        el("cuerpoDetalle").onclick = alPulsar;

        Comun.limitarAHoy(el("txtFechaCambio"));
        el("txtFechaCambio").oninput = function () {
            el("errFechaCambio").innerHTML = Comun.revisarFecha(this.value);
        };

        if (el("btnAgregar")) el("btnAgregar").onclick = abrirAgregar;
        if (el("btnFecha")) el("btnFecha").onclick = aplicarFechaATodos;
        if (el("btnGrabar")) el("btnGrabar").onclick = grabar;
        el("btnConfirmarAgregar").onclick = confirmarAgregar;
        el("btnCancelarAgregar").onclick = function () { el("veloAgregar").className = "velo"; };
        el("btnCerrarAgregar").onclick = function () { el("veloAgregar").className = "velo"; };

        Comun.armarLupa();
        if (el("btnLupa")) {
            el("btnLupa").onclick = function () {
                Comun.abrirLupa(function (codigo, nombre) {
                    el("txtTrabajador").value = codigo;
                    el("txtNombre").value = nombre;
                    cargar(Demo.copiaDetalle());
                });
            };
        }
    }

    return { iniciar: iniciar, cargar: cargar, pintar: pintar, filas: function () { return filas; } };
})();
