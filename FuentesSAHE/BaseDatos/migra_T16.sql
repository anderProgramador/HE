-- ============================================================================
-- SAHE - Migración de Conceptos
--   Origen  : BNSAHET16_CONCEPTOS            (34 filas)
--   Destino : DVSAHET16_CONCEPTOS            (ver crea_T16.sql)
--
--   T16_ESTADOREGISTRO -> T16_CACCION            los valores I, U y D pasan tal cual
--   (no existía)       -> T16_CESTADOREGISTRO    'A' si está vigente y su acción no
--                                                es 'D'; 'I' en cualquier otro caso
--   T16_ESTADOFUNCIONAL se mantiene
--
-- Reparto del origen: 9 D vigentes, 1 D cerrada, 6 I vigentes, 12 I cerradas,
-- 2 U vigentes y 4 U cerradas. La pantalla debe quedar con 8 activas.
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

set linesize 200
set pagesize 100
set feedback on
whenever sqlerror exit failure rollback

prompt ===== ANTES DE MIGRAR =====
select (select count(*) from BNSAHET16_CONCEPTOS) as origen,
       (select count(*) from DVSAHET16_CONCEPTOS) as destino from dual;

prompt ===== MIGRANDO =====
insert into DVSAHET16_CONCEPTOS (
       T16_CCONCEPTO, T16_SECUENCIA, T16_FINIEFECTIVA, T16_FFINEFECTIVA,
       T16_DESCRIPCION, T16_ESTADOFUNCIONAL, T16_CACCION, T16_CESTADOREGISTRO,
       T16_CREADOPOR, T16_FCREACION, T16_ACTUALIZADOPOR, T16_FACTUALIZACION,
       T16_COMPUTERID, T16_LOGINID)
select o.T16_CCONCEPTO,
       o.T16_SECUENCIA,
       o.T16_FINIEFECTIVA,
       o.T16_FFINEFECTIVA,
       o.T16_DESCRIPCION,
       o.T16_ESTADOFUNCIONAL,
       o.T16_ESTADOREGISTRO,
       case when o.T16_FFINEFECTIVA >= to_date('31/12/9999','DD/MM/YYYY')
             and o.T16_ESTADOREGISTRO <> 'D'
            then 'A' else 'I' end,
       o.T16_CREADOPOR,
       o.T16_FCREACION,
       o.T16_ACTUALIZADOPOR,
       o.T16_FACTUALIZACION,
       o.T16_COMPUTERID,
       o.T16_LOGINID
  from BNSAHET16_CONCEPTOS o
 order by o.T16_CCONCEPTO, o.T16_SECUENCIA, o.T16_FCREACION;

commit;

prompt ===== DESPUES DE MIGRAR =====
select (select count(*) from BNSAHET16_CONCEPTOS) as origen,
       (select count(*) from DVSAHET16_CONCEPTOS) as destino,
       (select count(*) from DVSAHET16_CONCEPTOS where T16_CESTADOREGISTRO = 'A') as activas
  from dual;

prompt ===== LO QUE VERIA LA PANTALLA =====
col ccon format a10
col des format a46
select T16_ID as id, T16_CCONCEPTO as ccon, T16_SECUENCIA as sec,
       T16_DESCRIPCION as des, T16_ESTADOFUNCIONAL as est
  from DVSAHET16_CONCEPTOS where T16_CESTADOREGISTRO = 'A' order by T16_CCONCEPTO;

exit
