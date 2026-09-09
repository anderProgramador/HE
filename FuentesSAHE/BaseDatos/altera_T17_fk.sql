-- ============================================================================
-- SAHE - T17 pasa a referenciar el concepto por su llave y no por su código
--
-- Dos cosas, en este orden:
--
--   1. Normaliza 'c001' a 'C001' en DVSAHET16. Los datos migrados traían el
--      mismo concepto escrito de las dos formas y 4 410 filas de T17 no
--      encontraban su concepto.
--
--   2. Reemplaza T17_CCONCEPTO por T17_T16_ID, con llave foránea a
--      DVSAHET16_CONCEPTOS. Cada fila se apunta a la fila ACTIVA del concepto
--      que tenía por código; se verificó antes que los 8 conceptos usados en
--      T17 tienen exactamente una fila activa en T16.
--
-- CONSECUENCIA QUE HAY QUE TENER PRESENTE
-- Modificar un concepto en T16 cierra su fila e inserta otra con id nuevo. Si
-- nadie hace nada, las filas de T17 quedan apuntando a la versión cerrada y
-- desaparecen de la pantalla. Por eso DVPKG_SPT16.actualizar ahora reapunta
-- las filas activas de T17 al id nuevo, dentro de la misma transacción. Es el
-- precio de referenciar por llave en un modelo con versiones.
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

set linesize 200
set pagesize 100
set feedback on
whenever sqlerror exit failure rollback

prompt ===== 1. NORMALIZA EL CODIGO =====
update DVSAHET16_CONCEPTOS
   set T16_CCONCEPTO = upper(T16_CCONCEPTO)
 where T16_CCONCEPTO <> upper(T16_CCONCEPTO);
commit;

select T16_CCONCEPTO, count(*) as filas,
       sum(case when T16_CESTADOREGISTRO = 'A' then 1 else 0 end) as activas
  from DVSAHET16_CONCEPTOS group by T16_CCONCEPTO order by 1;

prompt ===== 2. COLUMNA NUEVA =====
alter table DVSAHET17_CONCEPTOXTRABAJADOR add (T17_T16_ID number);

update DVSAHET17_CONCEPTOXTRABAJADOR t17
   set t17.T17_T16_ID = (select c.T16_ID
                           from DVSAHET16_CONCEPTOS c
                          where c.T16_CCONCEPTO = upper(t17.T17_CCONCEPTO)
                            and c.T16_CESTADOREGISTRO = 'A');
commit;

prompt ===== FILAS SIN CONCEPTO (deben ser 0) =====
select count(*) as sin_concepto from DVSAHET17_CONCEPTOXTRABAJADOR where T17_T16_ID is null;

prompt ===== 3. RESTRICCIONES =====
alter table DVSAHET17_CONCEPTOXTRABAJADOR modify (T17_T16_ID number not null);

alter table DVSAHET17_CONCEPTOXTRABAJADOR
  add constraint BNFK_T1701 foreign key (T17_T16_ID)
      references DVSAHET16_CONCEPTOS (T16_ID);

-- El único y el índice de búsqueda pasan a trabajar sobre la llave.
drop index UNQ_T1701;
create unique index UNQ_T1701 on DVSAHET17_CONCEPTOXTRABAJADOR (
    case when T17_CESTADOREGISTRO = 'A' then T17_CTRABAJADOR end,
    case when T17_CESTADOREGISTRO = 'A' then T17_T16_ID      end
);

drop index IDX_T1702;
create index IDX_T1702 on DVSAHET17_CONCEPTOXTRABAJADOR (T17_T16_ID, T17_CESTADOREGISTRO);

prompt ===== 4. FUERA LA COLUMNA VIEJA =====
alter table DVSAHET17_CONCEPTOXTRABAJADOR drop column T17_CCONCEPTO;

comment on column DVSAHET17_CONCEPTOXTRABAJADOR.T17_T16_ID is 'Concepto asignado. Apunta a la fila ACTIVA de DVSAHET16_CONCEPTOS; DVPKG_SPT16.actualizar lo reapunta cuando el concepto cambia de versión.';

prompt ===== COMO QUEDO =====
select column_id, column_name, nullable from user_tab_columns
 where table_name = 'DVSAHET17_CONCEPTOXTRABAJADOR' order by column_id;

select constraint_name, constraint_type, status from user_constraints
 where table_name = 'DVSAHET17_CONCEPTOXTRABAJADOR' and constraint_type in ('P','R') order by 1;

prompt ===== REPARTO POR CONCEPTO =====
select c.T16_CCONCEPTO as concepto, c.T16_DESCRIPCION as descripcion, count(*) as filas
  from DVSAHET17_CONCEPTOXTRABAJADOR t inner join DVSAHET16_CONCEPTOS c on c.T16_ID = t.T17_T16_ID
 where t.T17_CESTADOREGISTRO = 'A'
 group by c.T16_CCONCEPTO, c.T16_DESCRIPCION order by 1;

exit
