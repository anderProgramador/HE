-- ============================================================================
-- SAHE - Migración de Excepción por Puesto
--   Origen  : BNSAHET05_EXCEPCIONXPUESTO   (78 filas, modelo anterior)
--   Destino : DVSAHET05_EXCEPCIONXPUESTO   (modelo nuevo, ver crea_T05.sql)
--
-- Equivalencias que NO son 1 a 1, las mismas reglas que se usaron en T12:
--
--   T05_ESTADOREGISTRO  ->  T05_CACCION
--       Los valores I, U y D pasan tal cual; los admite CHK_T0501.
--
--   (no existía)        ->  T05_CESTADOREGISTRO
--       'A' cuando la fila está vigente (T05_FFINEFECTIVA = 31/12/9999) y su
--       acción no es 'D'; 'I' en cualquier otro caso.
--       Reparto del origen: 37 filas D vigentes, 37 I cerradas y 4 I vigentes,
--       así que la pantalla debe quedar con 4 registros activos.
--
--   (no existía)        ->  T05_ESTADOFUNCIONAL
--       En T12 venía del origen; aquí el concepto no existía. Todas las filas
--       entran como 'A': nada en los datos dice que alguna estuviera
--       funcionalmente inactiva, y suponerlo sería inventar información.
--
--   T05_ID
--       No existe en el origen; lo genera la identidad del destino en el orden
--       puesto, secuencia, fecha de creación.
--
-- El índice único UNQ_T0501 solo alcanza a las filas activas, así que las
-- versiones históricas -que repiten puesto y lugar- no lo violan. Se verificó
-- antes de migrar que entre las activas no se repite puesto + lugar.
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

set linesize 200
set pagesize 100
set feedback on
whenever sqlerror exit failure rollback

prompt ===== ANTES DE MIGRAR =====
select (select count(*) from BNSAHET05_EXCEPCIONXPUESTO) as origen,
       (select count(*) from DVSAHET05_EXCEPCIONXPUESTO) as destino
  from dual;

prompt ===== MIGRANDO =====
insert into DVSAHET05_EXCEPCIONXPUESTO (
       T05_CPUESTO,
       T05_SECUENCIA,
       T05_FINIEFECTIVA,
       T05_FFINEFECTIVA,
       T05_CLUGARTRABAJO,
       T05_ESTADOFUNCIONAL,
       T05_CACCION,
       T05_CESTADOREGISTRO,
       T05_CREADOPOR,
       T05_FCREACION,
       T05_ACTUALIZADOPOR,
       T05_FACTUALIZACION,
       T05_COMPUTERID,
       T05_LOGINID)
select o.T05_CPUESTO,
       o.T05_SECUENCIA,
       o.T05_FINIEFECTIVA,
       o.T05_FFINEFECTIVA,
       o.T05_CLUGARTRABAJO,
       'A',
       o.T05_ESTADOREGISTRO,
       case when o.T05_FFINEFECTIVA >= to_date('31/12/9999','DD/MM/YYYY')
             and o.T05_ESTADOREGISTRO <> 'D'
            then 'A' else 'I' end,
       o.T05_CREADOPOR,
       o.T05_FCREACION,
       o.T05_ACTUALIZADOPOR,
       o.T05_FACTUALIZACION,
       o.T05_COMPUTERID,
       o.T05_LOGINID
  from BNSAHET05_EXCEPCIONXPUESTO o
 order by o.T05_CPUESTO, o.T05_SECUENCIA, o.T05_FCREACION;

commit;

prompt ===== DESPUES DE MIGRAR =====
select (select count(*) from BNSAHET05_EXCEPCIONXPUESTO) as origen,
       (select count(*) from DVSAHET05_EXCEPCIONXPUESTO) as destino,
       (select count(*) from DVSAHET05_EXCEPCIONXPUESTO where T05_CESTADOREGISTRO = 'A') as activas
  from dual;

prompt ===== REPARTO ACCION / ESTADO =====
select T05_CACCION as accion, T05_CESTADOREGISTRO as estado, count(*) as filas
  from DVSAHET05_EXCEPCIONXPUESTO
 group by T05_CACCION, T05_CESTADOREGISTRO
 order by 1, 2;

prompt ===== LO QUE VERIA LA PANTALLA (estado del registro = A) =====
col cpuesto format a10
col dpuesto format a42
col lugar format a26
select t.T05_ID as id, t.T05_CPUESTO as cpuesto, p.dpuesto,
       l.dlugartrabajo as lugar, t.T05_SECUENCIA as sec, t.T05_ESTADOFUNCIONAL as est
  from DVSAHET05_EXCEPCIONXPUESTO t
  inner join BN_BN_HR_VI_SAHE_PUESTO p        on p.cpuesto = t.T05_CPUESTO
  inner join BN_BN_HR_VI_SAHE_LUGARTRABAJO l  on l.clug    = t.T05_CLUGARTRABAJO
 where t.T05_CESTADOREGISTRO = 'A'
 order by p.dpuesto;

exit
