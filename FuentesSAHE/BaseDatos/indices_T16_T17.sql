-- ============================================================================
-- SAHE - Índices para el listado por bloques de T17
--
-- La pantalla trae 35 218 filas en tandas. La consulta de cada tanda es
--
--     where  t17_cestadoregistro = 'A'
--       and  t17_id > :ultimo
--     order by t17_id
--     fetch first :tamano rows only
--
-- Se pagina por LLAVE y no por OFFSET a propósito: con OFFSET, Oracle tiene
-- que leer y descartar las filas anteriores, así que el bloque 18 cuesta 18
-- veces lo que el bloque 1. Pidiendo "lo que sigue del último id" cada tanda
-- cuesta lo mismo que la primera.
--
-- Para que eso sea un simple recorrido de índice hace falta que las dos
-- columnas estén en el mismo índice y en ese orden: primero la que se filtra
-- por igualdad, después la que ordena y acota.
--
-- IDX_T1701 (ctrabajador, cestadoregistro) no sirve para esto: la primera
-- columna no aparece en la consulta.
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

set linesize 200
set pagesize 100
set feedback on
whenever sqlerror exit failure rollback

prompt ===== INDICE PARA EL RECORRIDO POR BLOQUES =====
create index IDX_T1703 on DVSAHET17_CONCEPTOXTRABAJADOR (T17_CESTADOREGISTRO, T17_ID);

-- El mismo criterio para T16, que se recorre entera en cada carga. Son pocas
-- filas hoy, pero el índice ya existe como IDX_T1601 (cestadoregistro) y le
-- falta el orden: se rehace con la columna de orden incluida.
prompt ===== INDICE DE T16 CON EL ORDEN INCLUIDO =====
drop index IDX_T1601;
create index IDX_T1601 on DVSAHET16_CONCEPTOS (T16_CESTADOREGISTRO, T16_CCONCEPTO, T16_ID);

prompt ===== ESTADISTICAS =====
begin
  dbms_stats.gather_table_stats(user, 'DVSAHET17_CONCEPTOXTRABAJADOR', cascade => true);
  dbms_stats.gather_table_stats(user, 'DVSAHET16_CONCEPTOS', cascade => true);
end;
/

prompt ===== COMO QUEDARON =====
col index_name format a16
col columnas format a56
select i.table_name, i.index_name, i.uniqueness,
       listagg(c.column_name, ', ') within group (order by c.column_position) as columnas
  from user_indexes i join user_ind_columns c on c.index_name = i.index_name
 where i.table_name in ('DVSAHET16_CONCEPTOS','DVSAHET17_CONCEPTOXTRABAJADOR')
 group by i.table_name, i.index_name, i.uniqueness
 order by 1, 2;

exit
