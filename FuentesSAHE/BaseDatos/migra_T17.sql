-- ============================================================================
-- SAHE - Migración de Concepto por Trabajador
--   Origen  : BNSAHET17_CONCEPTOXTRABAJADOR   (35 254 filas)
--   Destino : DVSAHET17_CONCEPTOXTRABAJADOR   (ver crea_T17.sql)
--
--   T16_CCONCEPTO + T16_SECUENCIA -> T17_CCONCEPTO
--       Se conserva solo el código; la secuencia de la versión del concepto se
--       descarta porque el nuevo modelo referencia al concepto y no a una de
--       sus versiones (ver la nota en crea_T17.sql).
--   T17_ESTADOREGISTRO -> T17_CACCION
--   (no existía)       -> T17_CESTADOREGISTRO
--   (no existía)       -> T17_ESTADOFUNCIONAL, en 'A' para todas
--
-- Reparto del origen: 17 D vigentes, 17 I cerradas, 35 218 I vigentes y 2 U
-- cerradas, así que deben quedar 35 218 activas.
--
-- Son 35 mil filas: se hace en una sola sentencia y con un commit al final,
-- que es más rápido y deja la tabla consistente si algo falla.
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

set linesize 200
set pagesize 100
set feedback on
set timing on
whenever sqlerror exit failure rollback

prompt ===== ANTES DE MIGRAR =====
select (select count(*) from BNSAHET17_CONCEPTOXTRABAJADOR) as origen,
       (select count(*) from DVSAHET17_CONCEPTOXTRABAJADOR) as destino from dual;

prompt ===== MIGRANDO =====
insert /*+ append */ into DVSAHET17_CONCEPTOXTRABAJADOR (
       T17_CTRABAJADOR, T17_SECUENCIA, T17_CCONCEPTO,
       T17_FINIEFECTIVA, T17_FFINEFECTIVA,
       T17_IMPORTE, T17_IMPORTEANTERIOR, T17_FCAMBIO,
       T17_ESTADOFUNCIONAL, T17_CACCION, T17_CESTADOREGISTRO,
       T17_CREADOPOR, T17_FCREACION, T17_ACTUALIZADOPOR, T17_FACTUALIZACION,
       T17_COMPUTERID, T17_LOGINID)
select o.T17_CTRABAJADOR,
       o.T17_SECUENCIA,
       o.T16_CCONCEPTO,
       o.T17_FINIEFECTIVA,
       o.T17_FFINEFECTIVA,
       o.T17_IMPORTE,
       o.T17_IMPORTEANTERIOR,
       o.T17_FCAMBIO,
       'A',
       o.T17_ESTADOREGISTRO,
       case when o.T17_FFINEFECTIVA >= to_date('31/12/9999','DD/MM/YYYY')
             and o.T17_ESTADOREGISTRO <> 'D'
            then 'A' else 'I' end,
       o.T17_CREADOPOR,
       o.T17_FCREACION,
       o.T17_ACTUALIZADOPOR,
       o.T17_FACTUALIZACION,
       o.T17_COMPUTERID,
       o.T17_LOGINID
  from BNSAHET17_CONCEPTOXTRABAJADOR o
 order by o.T17_CTRABAJADOR, o.T16_CCONCEPTO, o.T17_SECUENCIA;

commit;

prompt ===== DESPUES DE MIGRAR =====
select (select count(*) from BNSAHET17_CONCEPTOXTRABAJADOR) as origen,
       (select count(*) from DVSAHET17_CONCEPTOXTRABAJADOR) as destino,
       (select count(*) from DVSAHET17_CONCEPTOXTRABAJADOR where T17_CESTADOREGISTRO = 'A') as activas
  from dual;

prompt ===== REPARTO ACCION / ESTADO =====
select T17_CACCION as accion, T17_CESTADOREGISTRO as estado, count(*) as filas
  from DVSAHET17_CONCEPTOXTRABAJADOR group by T17_CACCION, T17_CESTADOREGISTRO order by 1,2;

prompt ===== CONCEPTOS QUE NO EXISTEN EN T16 =====
select o.T17_CCONCEPTO, count(*) as filas
  from DVSAHET17_CONCEPTOXTRABAJADOR o
 where o.T17_CESTADOREGISTRO = 'A'
   and not exists (select 1 from DVSAHET16_CONCEPTOS c
                    where c.T16_CCONCEPTO = o.T17_CCONCEPTO
                      and c.T16_CESTADOREGISTRO = 'A')
 group by o.T17_CCONCEPTO order by 1;

exit
