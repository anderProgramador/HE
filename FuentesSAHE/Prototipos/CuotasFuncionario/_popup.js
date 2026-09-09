/* =========================================================================
   Datos y piezas que comparten los tres prototipos de la ventana de
   mantenimiento de T01FUN.

   El caso nuevo: el funcionario reparte su cuota entre las oficinas que
   dependen de él, PERO también puede asignarse horas a sí mismo -a su propia
   oficina-. Son dos cosas distintas y el paquete las guarda en campos
   distintos:

       Cuota Global      lo que se le asigna a una oficina dependiente
       Cuota Individual   lo que el funcionario se asigna a su propia oficina

   Nunca conviven: una línea es de una clase o de la otra, y la que no aplica
   viaja en 0. Lo que cambia entre los tres prototipos es cómo se le muestra
   eso al usuario.

   ES5 puro: la intranet corre sobre Chrome 49.
   ========================================================================= */
var Pop = (function () {
    "use strict";

    var Pop = {};

    Pop.periodo = "202609";

    /* La ubicación con la que se entró, la que dice la cabecera del
       escritorio. Es la que convierte una línea en 'individual'. */
    Pop.propia = { codigo: "7800", nombre: "GERENCIA DE INNOVACIÓN Y TRANSFORMACIÓN DIGITAL" };

    /* Lo que queda por repartir de la cuota de esa ubicación en el periodo.
       Lo manda el paquete; aquí es el tope de la ventana. */
    Pop.pendiente = "594:00";

    /* Lo que ofrece la lupa: las oficinas dependientes y la propia. */
    Pop.oficinas = [
        { codigo: "7800", nombre: "GERENCIA DE INNOVACIÓN Y TRANSFORMACIÓN DIGITAL" },
        { codigo: "7900", nombre: "GERENCIA BANCA DIGITAL" },
        { codigo: "8300", nombre: "GERENCIA DE TECNOLOGÍAS DE INFORMACIÓN" },
        { codigo: "8500", nombre: "GERENCIA DE DATOS Y ANALÍTICA" },
        { codigo: "8600", nombre: "SUBGERENCIA DE ARQUITECTURA" },
        { codigo: "8700", nombre: "SUBGERENCIA DE CIBERSEGURIDAD" }
    ];

    Pop.esPropia = function (codigo) {
        return String(codigo || "") === Pop.propia.codigo;
    };

    Pop.oficinaDe = function (codigo) {
        var i;
        for (i = 0; i < Pop.oficinas.length; i++) {
            if (Pop.oficinas[i].codigo === String(codigo || "")) return Pop.oficinas[i];
        }
        return null;
    };

    /* Cuántos meses quedan en el año después del periodo 'aaaamm'. Es el tope
       de la replicación: una cuota de setiembre alcanza como mucho a octubre,
       noviembre y diciembre. */
    Pop.mesesQueQuedan = function (periodo) {
        var mes = Number(String(periodo || "").substring(4, 6));
        if (isNaN(mes) || mes < 1 || mes > 12) return 0;
        return 12 - mes;
    };

    /* ------------------------------------------------------------ lupa --- */

    /* La ventana de búsqueda de oficinas. La arma una sola vez y la reusa: es
       la misma en los tres prototipos porque la lupa no es lo que se está
       comparando. */
    Pop.abrirLupa = function (alElegir) {
        var velo = Fun.porId("veloLupa");
        var cuerpo = Fun.porId("cuerpoLupa");
        var i, fila;

        cuerpo.innerHTML = "";
        for (i = 0; i < Pop.oficinas.length; i++) {
            fila = document.createElement("tr");
            fila.appendChild(Fun.crear("td", "", Pop.oficinas[i].codigo));
            fila.appendChild(Fun.crear("td", "", Pop.oficinas[i].nombre));
            fila.appendChild(Fun.crear("td", "cen",
                Pop.esPropia(Pop.oficinas[i].codigo) ? "Su oficina" : "Dependiente"));
            fila.onclick = (function (oficina) {
                return function () { Pop.cerrarLupa(); alElegir(oficina); };
            })(Pop.oficinas[i]);
            cuerpo.appendChild(fila);
        }
        velo.className = "velo abierto";
    };

    Pop.cerrarLupa = function () {
        Fun.porId("veloLupa").className = "velo";
    };

    /* El marcado de la lupa, para no repetirlo en los tres archivos. */
    Pop.marcadoLupa =
        '<div class="velo" id="veloLupa">' +
            '<div class="ventana" style="max-width:720px">' +
                '<div class="ventana__barra">' +
                    '<div class="ventana__titulo">Búsqueda de oficinas</div>' +
                    '<button type="button" class="ventana__cerrar" id="btnCerrarLupa" title="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="ventana__cuerpo">' +
                    '<div class="rejilla"><table class="tabla">' +
                        '<thead><tr><th class="col-codigo">Código</th><th>Oficina</th>' +
                        '<th class="cen" style="width:130px">Relación</th></tr></thead>' +
                        '<tbody id="cuerpoLupa"></tbody>' +
                    '</table></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    return Pop;
})();
