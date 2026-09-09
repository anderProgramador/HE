/* ============================================================================
   SAHE - T01 - Asignación de Cuotas Administrativas
   Datos de demostración: lo que devolvería el paquete al cargar la pantalla.

   Hay cuotas en tres periodos para que se note el efecto de elegir varios a la
   vez; el catálogo de periodos ofrece los doce meses del año.

   JavaScript nativo, ES5, compatible con Chrome 49. Sin librerías.
   ========================================================================== */
var Demo = (function () {
    "use strict";

    var ANIO = "2026";
    var PERIODO_ACTUAL = "202609";

    var MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
                 "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];

    /* Los periodos que ofrece el combo. En el aplicativo llegan como una lista
       más del segmento de combos de SAHE/Cargar. */
    function periodos() {
        var salida = [], i, mm;
        for (i = 1; i <= 12; i++) {
            mm = i < 10 ? "0" + i : String(i);
            salida.push({ codigo: ANIO + mm, nombre: MESES[i - 1] + " " + ANIO });
        }
        return salida;
    }

    /* Catálogo de oficinas: alimenta el combo de la cabecera y la lupa del
       mantenimiento. */
    var oficinas = [
        { codigo: "1000", nombre: "PRESIDENCIA EJECUTIVA" },
        { codigo: "1200", nombre: "OFICIALÍA DE PLAFT" },
        { codigo: "1300", nombre: "ÓRGANO DE CONTROL INSTITUCIONAL" },
        { codigo: "1400", nombre: "ORGANO DE AUDITORÍA INTERNA" },
        { codigo: "1500", nombre: "OFICIALIA DE CUMPLIMIENTO NORMATIVO Y CONDUCTA DE MERCADO" },
        { codigo: "2000", nombre: "GERENCIA GENERAL" },
        { codigo: "2100", nombre: "GERENCIA DE RIESGOS" },
        { codigo: "4500", nombre: "GERENCIA LEGAL" },
        { codigo: "5500", nombre: "GERENCIA DE ADMINISTRACIÓN Y LOGÍSTICA" },
        { codigo: "7400", nombre: "GERENCIA DE FINANZAS Y TESORERÍA" },
        { codigo: "7500", nombre: "GERENCIA DE RECURSOS HUMANOS Y CULTURA" },
        { codigo: "7600", nombre: "COMUNICACIONES Y RELACIONES INSTITUCIONALES" },
        { codigo: "7700", nombre: "GERENCIA DE TECNOLOGÍA DE LA INFORMACIÓN" },
        { codigo: "7800", nombre: "GERENCIA DE OPERACIONES" },
        { codigo: "8100", nombre: "GERENCIA DE NEGOCIOS" },
        { codigo: "8300", nombre: "GERENCIA DE BANCA MINORISTA" },
        { codigo: "8500", nombre: "GERENCIA DE RED DE AGENCIAS" },
        { codigo: "8800", nombre: "GERENCIA DE PLANEAMIENTO Y DESARROLLO" },
        { codigo: "9100", nombre: "GERENCIA DE PRODUCTOS Y CANALES" },
        /* Sin cuota en ningún periodo: son las que el alta tiene que ofrecer. */
        { codigo: "9300", nombre: "GERENCIA DE EXPERIENCIA DEL CLIENTE" },
        { codigo: "9500", nombre: "GERENCIA DE INCLUSIÓN FINANCIERA" }
    ];

    /* Lo que devolvería el paquete al listar. 'adjunto' vacío significa que la
       cuota se registró sin sustento documental; al grabar viaja como 'S/R'. */
    var cuotas = [
        { id: "1",  periodo: "202609", codigo: "1000", horas: 42017, adjunto: "MEMO-1000-2026.pdf" },
        { id: "2",  periodo: "202609", codigo: "1200", horas: 60,    adjunto: "" },
        { id: "3",  periodo: "202609", codigo: "1300", horas: 24,    adjunto: "" },
        { id: "4",  periodo: "202609", codigo: "1400", horas: 26,    adjunto: "MEMO-1400-2026.pdf" },
        { id: "5",  periodo: "202609", codigo: "1500", horas: 30,    adjunto: "" },
        { id: "6",  periodo: "202609", codigo: "2000", horas: 41742, adjunto: "MEMO-2000-2026.pdf" },
        { id: "7",  periodo: "202609", codigo: "2100", horas: 120,   adjunto: "" },
        { id: "8",  periodo: "202609", codigo: "4500", horas: 100,   adjunto: "" },
        { id: "9",  periodo: "202609", codigo: "5500", horas: 212,   adjunto: "MEMO-5500-2026.pdf" },
        { id: "10", periodo: "202609", codigo: "7400", horas: 152,   adjunto: "" },
        { id: "11", periodo: "202609", codigo: "7500", horas: 200,   adjunto: "MEMO-7500-2026.pdf" },
        { id: "12", periodo: "202609", codigo: "7600", horas: 66,    adjunto: "" },
        { id: "13", periodo: "202609", codigo: "7700", horas: 480,   adjunto: "MEMO-7700-2026.pdf" },
        { id: "14", periodo: "202609", codigo: "7800", horas: 640,   adjunto: "" },
        { id: "15", periodo: "202609", codigo: "8100", horas: 310,   adjunto: "" },
        { id: "16", periodo: "202609", codigo: "8300", horas: 275,   adjunto: "MEMO-8300-2026.pdf" },
        { id: "17", periodo: "202609", codigo: "8500", horas: 1240,  adjunto: "" },
        { id: "18", periodo: "202609", codigo: "8800", horas: 96,    adjunto: "" },
        { id: "19", periodo: "202609", codigo: "9100", horas: 148,   adjunto: "" },

        { id: "20", periodo: "202608", codigo: "1000", horas: 40120, adjunto: "MEMO-1000-2026.pdf" },
        { id: "21", periodo: "202608", codigo: "2000", horas: 39880, adjunto: "MEMO-2000-2026.pdf" },
        { id: "22", periodo: "202608", codigo: "2100", horas: 110,   adjunto: "" },
        { id: "23", periodo: "202608", codigo: "5500", horas: 200,   adjunto: "" },
        { id: "24", periodo: "202608", codigo: "7500", horas: 180,   adjunto: "MEMO-7500-2026.pdf" },
        { id: "25", periodo: "202608", codigo: "7700", horas: 455,   adjunto: "" },
        { id: "26", periodo: "202608", codigo: "8500", horas: 1180,  adjunto: "MEMO-8500-2026.pdf" },

        { id: "27", periodo: "202607", codigo: "1000", horas: 38940, adjunto: "" },
        { id: "28", periodo: "202607", codigo: "2000", horas: 38210, adjunto: "MEMO-2000-2026.pdf" },
        { id: "29", periodo: "202607", codigo: "5500", horas: 195,   adjunto: "" },
        { id: "30", periodo: "202607", codigo: "7700", horas: 430,   adjunto: "" },
        { id: "31", periodo: "202607", codigo: "8500", horas: 1105,  adjunto: "" }
    ];

    /* Motivos frecuentes de un cambio de cuota. El usuario puede escribir uno
       distinto: la lista es un atajo, no una restricción. */
    var motivos = [
        "Ampliación de cuota por cierre contable",
        "Reducción por recorte presupuestal",
        "Corrección de error de digitación",
        "Reasignación entre gerencias",
        "Atención de proyecto extraordinario"
    ];

    function nombreOficina(codigo) {
        var i;
        for (i = 0; i < oficinas.length; i++) {
            if (oficinas[i].codigo === codigo) return oficinas[i].nombre;
        }
        return "";
    }

    /* Si esa gerencia ya tiene cuota en ese periodo. Es la regla de la llave
       única, adelantada para dar un mensaje entendible. */
    function tieneCuota(periodo, codigo) {
        var i;
        for (i = 0; i < cuotas.length; i++) {
            if (cuotas[i].periodo === periodo && cuotas[i].codigo === codigo) return true;
        }
        return false;
    }

    function nombrePeriodo(periodo) {
        var mes = Number(String(periodo).substring(4, 6));
        if (mes < 1 || mes > 12) return String(periodo);
        return MESES[mes - 1] + " " + String(periodo).substring(0, 4);
    }

    /* Cuántos meses quedan en el año después del periodo. Es el tope de la
       replicación: una cuota de setiembre alcanza como mucho a octubre,
       noviembre y diciembre. */
    function mesesQueQuedan(periodo) {
        var mes = Number(String(periodo).substring(4, 6));
        if (mes < 1 || mes > 12) return 0;
        return 12 - mes;
    }

    /* Los periodos que recibirían la copia, en orden. */
    function periodosSiguientes(periodo, cuantos) {
        var anio = Number(String(periodo).substring(0, 4));
        var mes = Number(String(periodo).substring(4, 6));
        var salida = [], i, m;

        for (i = 1; i <= cuantos; i++) {
            m = mes + i;
            if (m > 12) break;
            salida.push(String(anio) + (m < 10 ? "0" + m : String(m)));
        }
        return salida;
    }

    return {
        anio: ANIO,
        periodoActual: PERIODO_ACTUAL,
        periodos: periodos,
        oficinas: oficinas,
        cuotas: cuotas,
        motivos: motivos,
        nombreOficina: nombreOficina,
        tieneCuota: tieneCuota,
        nombrePeriodo: nombrePeriodo,
        mesesQueQuedan: mesesQueQuedan,
        periodosSiguientes: periodosSiguientes
    };
})();
