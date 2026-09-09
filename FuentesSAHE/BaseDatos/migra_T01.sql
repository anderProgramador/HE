select (select count(*) from bnsahet01_asigcuotas) as origen,
       (select count(*) from dvsahet01_asigcuotas) as destino from dual;


insert /*+ append */ into dvsahet01_asigcuotas (
       t01_periodo, t01_coficina, t01_SECUENCIA,
       t01_FINIEFECTIVA, t01_FFINEFECTIVA,
       t01_cuotaglobal, t01_cuotaindividual, t01_estado,
       t01_motivo, t01_documento, t01_CACCION, t01_CESTADOREGISTRO,
       t01_CREADOPOR, t01_FCREACION, t01_ACTUALIZADOPOR, t01_FACTUALIZACION,
       t01_COMPUTERID, t01_LOGINID, t01_modificarreplicar, t01_cantreplicar)
select o.t01_periodo,
       o.t01_coficina,
       o.t01_secuencia,
       o.T01_FINIEFECTIVA,
       o.T01_FFINEFECTIVA,
       o.t01_cuotaglobal,
       o.t01_cuotaindividual,
       o.t01_estado,
       o.t01_motivo,
       o.t01_documento,
       o.T01_ESTADOREGISTRO,
       case when o.T01_FFINEFECTIVA >= to_date('31/12/9999','DD/MM/YYYY')
             and o.T01_ESTADOREGISTRO <> 'D'
            then 'A' else 'I' end,
       o.T01_CREADOPOR,
       o.T01_FCREACION,
       o.T01_ACTUALIZADOPOR,
       o.T01_FACTUALIZACION,
       o.T01_COMPUTERID,
       o.T01_LOGINID,
       o.t01_modificarreplicar,
       o.t01_cantreplicar
  from bnsahet01_asigcuotas o
 order by o.t01_periodo, o.t01_coficina, o.t01_SECUENCIA;
 
 commit;
 
 select (select count(*) from bnsahet01_asigcuotas) as origen,
       (select count(*) from dvsahet01_asigcuotas) as destino,
       (select count(*) from dvsahet01_asigcuotas where T01_CESTADOREGISTRO = 'A') as activas
  from dual;
  
 select T05_CACCION as accion, T05_CESTADOREGISTRO as estado, count(*) as filas
  from DVSAHET05_EXCEPCIONXPUESTO
 group by T05_CACCION, T05_CESTADOREGISTRO
 order by 1, 2;
