/* ============================================================================
   SAHE - T17  Datos de demostración compartidos por los tres prototipos.
   JavaScript nativo, ES5, compatible con Chrome 49.
   ========================================================================== */
var Demo = (function () {
    "use strict";

    /* Los 8 conceptos vigentes de DVSAHET16_CONCEPTOS. El valor es el T16_ID,
       que es lo que se graba desde que T17 referencia por llave foránea. */
    var conceptos = [
        { id: "11", codigo: "C001", nombre: "Asignación Familiar" },
        { id: "36", codigo: "C002", nombre: "Remuneración Básica" },
        { id: "37", codigo: "C003", nombre: "Diferencia por Categoría anterior al DU 09/94" },
        { id: "15", codigo: "C004", nombre: "Remuneración por Contrato" },
        { id: "16", codigo: "C005", nombre: "Bonificación Tiempo de Servicio" },
        { id: "17", codigo: "C006", nombre: "Asignación Casado" },
        { id: "27", codigo: "C007", nombre: "Asignación Hijo" },
        { id: "28", codigo: "C008", nombre: "Asignación Madre Viuda" }
    ];

    /* Lo que devolvería dvpkg_spT17.listar para el trabajador consultado. */
    var detalle = [
        { t17: "9001", t16: "28", anterior: 0,       nuevo: 0 },
        { t17: "9002", t16: "27", anterior: 113,     nuevo: 113 },
        { t17: "9003", t16: "17", anterior: 0,       nuevo: 0 },
        { t17: "9004", t16: "16", anterior: 51,      nuevo: 51 },
        { t17: "9005", t16: "15", anterior: 0,       nuevo: 0 },
        { t17: "9006", t16: "37", anterior: 0,       nuevo: 0 },
        { t17: "9007", t16: "36", anterior: 2855,    nuevo: 2855 },
        { t17: "9008", t16: "11", anterior: 0,       nuevo: 0 }
    ];

    var trabajador = { codigo: "90485193", nombre: "TAPIA RIVERA HEIDY JEANETTE" };

    /* La ayuda de la lupa. En el aplicativo llega en el segmento 2. */
    var trabajadores = [
        { codigo: "90485193", nombre: "TAPIA RIVERA HEIDY JEANETTE" },
        { codigo: "0137014",  nombre: "QUISPE MAMANI ROSA ELENA" },
        { codigo: "0142034",  nombre: "GARCIA LOPEZ JUAN CARLOS" },
        { codigo: "0332933",  nombre: "RAMIREZ SOTO MIGUEL ANGEL" },
        { codigo: "0333042",  nombre: "VARGAS DIAZ ANA LUCIA" }
    ];

    function conceptoDe(id) {
        var i;
        for (i = 0; i < conceptos.length; i++) {
            if (conceptos[i].id === id) return conceptos[i];
        }
        return { id: id, codigo: "?", nombre: "(concepto no vigente)" };
    }

    /* dd/mm/aaaa a aaaa-mm-dd, que es lo que entiende <input type="date">. */
    function hoyISO() {
        var d = new Date();
        var m = d.getMonth() + 1;
        var dia = d.getDate();
        return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (dia < 10 ? "0" + dia : dia);
    }

    function importe(valor) {
        var n = Number(valor);
        if (isNaN(n)) n = 0;
        return n.toFixed(2);
    }

    /* Suma pura: recibe datos y devuelve datos, se prueba sin navegador. */
    function totales(filas) {
        var suma = { anterior: 0, nuevo: 0 }, i;
        for (i = 0; i < filas.length; i++) {
            suma.anterior += aNumero(filas[i].anterior);
            suma.nuevo += aNumero(filas[i].nuevo);
        }
        return suma;
    }

    function copiaDetalle() {
        var salida = [], i;
        for (i = 0; i < detalle.length; i++) {
            salida.push({
                t17: detalle[i].t17, t16: detalle[i].t16,
                anterior: detalle[i].anterior, nuevo: detalle[i].nuevo,
                fecha: hoyISO()
            });
        }
        return salida;
    }

    /* Lo que devuelve ahora dvpkg_spT17.listar: el CONSOLIDADO, una fila por
       trabajador con la suma de sus conceptos. Los importes llegan con coma
       decimal, que es como los escribe to_char en la sesión del aplicativo. */
    var consolidado = [
        { codigo: "90485193", nombre: "TAPIA RIVERA HEIDY JEANETTE",     importe: "3019,00", anterior: "3019,00" },
        { codigo: "0137014",  nombre: "QUISPE MAMANI ROSA ELENA",        importe: "5141,92", anterior: "5141,92" },
        { codigo: "0142034",  nombre: "GARCIA LOPEZ JUAN CARLOS",        importe: "4970,78", anterior: "4970,78" },
        { codigo: "0332933",  nombre: "RAMIREZ SOTO MIGUEL ANGEL",       importe: "4995,9",  anterior: "4800,00" },
        { codigo: "0333042",  nombre: "VARGAS DIAZ ANA LUCIA",           importe: "4725,59", anterior: "4725,59" }
    ];

    /* Igual que en la grilla: se acepta coma o punto y se muestra el punto. */
    function aNumero(valor) {
        var texto = String(valor === null || valor === undefined ? "" : valor).replace(/\s/g, "");
        if (texto === "") return 0;
        if (texto.indexOf(",") !== -1 && texto.indexOf(".") === -1) texto = texto.replace(",", ".");
        else texto = texto.replace(/,/g, "");
        return isNaN(Number(texto)) ? 0 : Number(texto);
    }

    /* Miles con coma, decimales con punto, armado a mano para no depender del
       idioma del navegador. */
    function moneda(valor) {
        var partes = aNumero(valor).toFixed(2).split(".");
        var entera = partes[0], salida = "", i;
        for (i = entera.length; i > 3; i -= 3) salida = "," + entera.substring(i - 3, i) + salida;
        return entera.substring(0, i > 0 ? i : 0) + salida + "." + partes[1];
    }

    return {
        consolidado: consolidado,
        aNumero: aNumero,
        moneda: moneda,
        conceptos: conceptos,
        trabajador: trabajador,
        trabajadores: trabajadores,
        conceptoDe: conceptoDe,
        hoyISO: hoyISO,
        importe: importe,
        totales: totales,
        copiaDetalle: copiaDetalle
    };
})();
