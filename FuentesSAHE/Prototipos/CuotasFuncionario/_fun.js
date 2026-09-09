/* =========================================================================
   Datos de muestra y utilidades que comparten los tres prototipos.

   El caso: un funcionario -gerente o subgerente- que tiene A CARGO mas de
   una oficina. Cada oficina a cargo trae su propia cuota del periodo, y de
   esa cuota el funcionario reparte horas entre las oficinas que dependen de
   ella. La cuenta que tiene que cuadrar es una por bolsa, no una sola:

        asignada - repartida = pendiente     (por cada oficina a cargo)

   Todo va en hh:mm porque es como el paquete manda y recibe las horas.
   ES5 puro: la intranet corre sobre Chrome 49.
   ========================================================================= */
var Fun = (function () {
    "use strict";

    var Fun = {};

    Fun.periodo = "202609";

    Fun.funcionario = {
        codigo: "0277592",
        nombre: "GUEVARA CAMARA MARIA LUISA"
    };

    /* Las oficinas a cargo. Cada una es una BOLSA independiente: lo que
       sobra en una no puede gastarse en la otra. */
    Fun.bolsas = [
        { codigo: "7700", nombre: "GERENCIA DE INNOVACIÓN Y TRANSFORMACIÓN DIGITAL", asignada: "2636:00" },
        { codigo: "7800", nombre: "GERENCIA OPERACIONES", asignada: "1200:00" }
    ];

    /* El reparto ya hecho. 'bolsa' dice de que cuota sale cada linea: es el
       dato que el diseno anterior no mostraba y por el que no se sabia cual
       de las dos cuentas estaba tocando. */
    Fun.reparto = [
        { id: 1, bolsa: "7700", codigo: "7900", nombre: "GERENCIA BANCA DIGITAL", horas: "1220:00", adjunto: "MEMO-7900-2026.pdf" },
        { id: 2, bolsa: "7700", codigo: "8300", nombre: "GERENCIA DE TECNOLOGÍAS DE INFORMACIÓN", horas: "612:30", adjunto: "S/R" },
        { id: 3, bolsa: "7700", codigo: "8500", nombre: "GERENCIA DE DATOS Y ANALÍTICA", horas: "209:30", adjunto: "S/R" },
        { id: 4, bolsa: "7800", codigo: "3100", nombre: "SUBGERENCIA DE PROCESOS", horas: "312:00", adjunto: "MEMO-3100-2026.pdf" },
        { id: 5, bolsa: "7800", codigo: "3200", nombre: "SUBGERENCIA DE CANALES", horas: "120:00", adjunto: "S/R" }
    ];

    /* Las oficinas que dependen de cada bolsa: lo que ofrece la lupa al
       agregar una linea. Una oficina depende de UNA bolsa, asi que el
       destino ya dice a que cuenta se carga. */
    Fun.dependientes = {
        "7700": [
            { codigo: "7900", nombre: "GERENCIA BANCA DIGITAL" },
            { codigo: "8300", nombre: "GERENCIA DE TECNOLOGÍAS DE INFORMACIÓN" },
            { codigo: "8500", nombre: "GERENCIA DE DATOS Y ANALÍTICA" },
            { codigo: "8600", nombre: "SUBGERENCIA DE ARQUITECTURA" },
            { codigo: "8700", nombre: "SUBGERENCIA DE CIBERSEGURIDAD" }
        ],
        "7800": [
            { codigo: "3100", nombre: "SUBGERENCIA DE PROCESOS" },
            { codigo: "3200", nombre: "SUBGERENCIA DE CANALES" },
            { codigo: "3300", nombre: "SUBGERENCIA DE MEDIOS DE PAGO" },
            { codigo: "3400", nombre: "SUBGERENCIA DE SOPORTE OPERATIVO" }
        ]
    };

    /* ------------------------------------------------------------ horas -- */

    /* 'hh:mm' a minutos. Acepta tambien '120' -horas enteras- porque es como
       escribe el usuario cuando no hay minutos que repartir. */
    Fun.aMinutos = function (valor) {
        var texto = String(valor === null || valor === undefined ? "" : valor).replace(/\s/g, "");
        var partes;
        if (texto === "") return 0;
        partes = texto.split(":");
        if (partes.length === 1) return Math.abs(parseInt(partes[0], 10) || 0) * 60;
        return Math.abs(parseInt(partes[0], 10) || 0) * 60 + Math.abs(parseInt(partes[1], 10) || 0);
    };

    Fun.formatear = function (minutos) {
        var m = Math.abs(Math.round(minutos || 0));
        var mm = m % 60;
        return (m < 0 ? "-" : "") + Math.floor(m / 60) + ":" + (mm < 10 ? "0" + mm : mm);
    };

    Fun.conSigno = function (minutos) {
        return (minutos < 0 ? "-" : "") + Fun.formatear(minutos);
    };

    /* -------------------------------------------------------- la cuenta -- */

    /* El saldo de UNA bolsa. Es la unica cuenta que importa en esta pantalla
       y por eso vive en un solo lugar: los tres prototipos la muestran de
       forma distinta pero la calculan igual. */
    Fun.saldo = function (bolsa, lineas) {
        var asignada = Fun.aMinutos(bolsa.asignada), repartida = 0, i;
        var datos = lineas || Fun.reparto;
        for (i = 0; i < datos.length; i++) {
            if (datos[i].bolsa === bolsa.codigo) repartida += Fun.aMinutos(datos[i].horas);
        }
        return {
            asignada: asignada,
            repartida: repartida,
            pendiente: asignada - repartida,
            excedida: repartida > asignada,
            porcentaje: asignada === 0 ? 0 : Math.min(100, Math.round(repartida * 100 / asignada))
        };
    };

    Fun.bolsaDe = function (codigo) {
        var i;
        for (i = 0; i < Fun.bolsas.length; i++) {
            if (Fun.bolsas[i].codigo === codigo) return Fun.bolsas[i];
        }
        return null;
    };

    /* ------------------------------------------------------------ varios -- */

    Fun.crear = function (etiqueta, clase, texto) {
        var e = document.createElement(etiqueta);
        if (clase) e.className = clase;
        if (texto !== undefined && texto !== null) e.textContent = String(texto);
        return e;
    };

    Fun.porId = function (id) { return document.getElementById(id); };

    /* Deja escribir solo lo que puede ser una hora: cifras y un ':'. */
    Fun.limpiarHora = function (caja) {
        var limpio = String(caja.value).replace(/[^0-9:]/g, "").replace(/:(?=.*:)/g, "");
        if (limpio !== caja.value) caja.value = limpio;
    };

    Fun.iconos = {
        editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>',
        eliminar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>',
        pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M9 15h1.5a1.5 1.5 0 0 0 0-3H9v6"></path><path d="M14 18v-6h1.5a2.5 2.5 0 0 1 0 6Z"></path></svg>'
    };

    return Fun;
})();
