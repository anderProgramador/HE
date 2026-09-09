-- ============================================================================
-- SAHE - Migración de Tipo de Solicitud de Compensación
--   Origen  : BNSAHET12_TIPOCOMPENSACION   (25 filas, modelo anterior)
--   Destino : DVSAHET12_TIPOCOMPENSACION   (modelo nuevo)
--
-- Equivalencias que NO son 1 a 1:
--
--   T12_ESTADOREGISTRO  ->  T12_CACCION
--       La columna anterior guarda I, U y D, que son acciones y no estados.
--       Los tres valores pasan tal cual y los admite CHK_T1201.
--
--   (no existía)        ->  T12_CESTADOREGISTRO
--       'A' cuando la fila está vigente (T12_FFINEFECTIVA = 31/12/9999) y su
--       acción no es 'D'; 'I' en cualquier otro caso. Esa regla reproduce
--       exactamente las 5 filas que hoy muestra la pantalla, de 13 vigentes.
--
--   T12_ESTADOFUNCIONAL     se mantiene: es el Activo/Inactivo que el usuario
--       ve en la columna Estado, distinto del estado del registro.
--
--   T12_ID                  no existe en el origen; lo genera la identidad del
--       destino en el orden justificación, secuencia, fecha de creación.
--
-- La clave del origen es (T12_CJUSTIFICACION, T12_SECUENCIA, T12_CANTIDADHORA).
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

set linesize 200
set pagesize 100
set feedback on
whenever sqlerror exit failure rollback

prompt ===== ANTES DE MIGRAR =====
select (select count(*) from BNSAHET12_TIPOCOMPENSACION) as origen,
       (select count(*) from DVSAHET12_TIPOCOMPENSACION) as destino
  from dual;

prompt ===== MIGRANDO =====
insert into DVSAHET12_TIPOCOMPENSACION (
       T12_CJUSTIFICACION,
       T12_SECUENCIA,
       T12_FINIEFECTIVA,
       T12_FFINEFECTIVA,
       T12_TIPODURACION,
       T12_DTIPOSOLICITUD,
       T12_CANTIDADHORA,
       T12_ESTADOFUNCIONAL,
       T12_CACCION,
       T12_CESTADOREGISTRO,
       T12_CREADOPOR,
       T12_FCREACION,
       T12_ACTUALIZADOPOR,
       T12_FACTUALIZACION,
       T12_COMPUTERID,
       T12_LOGINID)
select o.T12_CJUSTIFICACION,
       o.T12_SECUENCIA,
       o.T12_FINIEFECTIVA,
       o.T12_FFINEFECTIVA,
       o.T12_TIPODURACION,
       o.T12_DTIPOSOLICITUD,
       o.T12_CANTIDADHORA,
       o.T12_ESTADOFUNCIONAL,
       o.T12_ESTADOREGISTRO,
       case when o.T12_FFINEFECTIVA >= to_date('31/12/9999','DD/MM/YYYY')
             and o.T12_ESTADOREGISTRO <> 'D'
            then 'A' else 'I' end,
       o.T12_CREADOPOR,
       o.T12_FCREACION,
       o.T12_ACTUALIZADOPOR,
       o.T12_FACTUALIZACION,
       o.T12_COMPUTERID,
       o.T12_LOGINID
  from BNSAHET12_TIPOCOMPENSACION o
 order by o.T12_CJUSTIFICACION, o.T12_SECUENCIA, o.T12_FCREACION;

commit;

prompt ===== DESPUES DE MIGRAR =====
select (select count(*) from BNSAHET12_TIPOCOMPENSACION) as origen,
       (select count(*) from DVSAHET12_TIPOCOMPENSACION) as destino,
       (select count(*) from DVSAHET12_TIPOCOMPENSACION where T12_CESTADOREGISTRO = 'A') as activas
  from dual;

prompt ===== REPARTO ACCION / ESTADO =====
select T12_CACCION as accion, T12_CESTADOREGISTRO as estado,
       T12_ESTADOFUNCIONAL as func, count(*) as filas
  from DVSAHET12_TIPOCOMPENSACION
 group by T12_CACCION, T12_CESTADOREGISTRO, T12_ESTADOFUNCIONAL
 order by 1, 2, 3;

prompt ===== LO QUE VERIA LA PANTALLA (estado del registro = A) =====
col cjustificacion format a16
col dtiposolicitud format a34
select T12_ID as id, T12_CJUSTIFICACION as cjustificacion, T12_SECUENCIA as sec,
       T12_TIPODURACION as duracion, substr(T12_DTIPOSOLICITUD,1,32) as dtiposolicitud,
       T12_CANTIDADHORA as horas, T12_ESTADOFUNCIONAL as estado
  from DVSAHET12_TIPOCOMPENSACION
 where T12_CESTADOREGISTRO = 'A'
 order by T12_CJUSTIFICACION, T12_SECUENCIA;

exit
