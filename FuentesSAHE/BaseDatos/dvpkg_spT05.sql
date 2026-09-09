-- ============================================================================
-- SAHE - BN_SAHE.DVPKG_SPT05   Excepción por Puesto
--
-- Mismo contrato que DVPKG_SPT12. La respuesta viaja en segmentos separados
-- por ~ :
--     cargar    [0] combos   lista de lugares ¦ lista de estados
--               [1] datos    filas de la grilla, separadas por ¬
--               [2] ayudas   catálogo de puestos para la lupa
--     gestionar [0] mensaje  C|.., A|.. o E|..
--               [1] datos    la grilla ya actualizada
--
-- Orden de la grilla (mapeo 'cargar' de T05.txt):
--     Id | Puesto | DescripcionPuesto | LugarTrabajo | Estado
-- Orden de obtener (los controles del popup, en el orden del txt):
--     accion | id | cpuesto | secuencia | dpuesto | dlugartrabajo |
--     estadofuncional | creadopor | fcreacion | actualizadopor
-- Orden que recibe gestionar (mapeo 'grabar', más lo que agrega el
-- controlador):
--     accion | id | cpuesto | secuencia | clugartrabajo | estadofuncional |
--     creadopor | actualizadopor | computerid | loginid
--
-- El registro no se borra: se cierra la vigencia de la fila activa y se
-- inserta la versión nueva con la secuencia siguiente. Eso deja el histórico
-- completo, que es lo que ya hacía T12.
--
-- Ejecutar con:  set NLS_LANG=SPANISH_PERU.AL32UTF8
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

/* Se compila con informacion de depuracion. Un 'create or replace' toma el
   PLSQL_DEBUG de la sesion, y en sqlplus por omision es FALSE: sin esto, el
   paquete queda VALID pero el depurador no puede entrar, y eso solo se
   descubre cuando hace falta poner un punto de interrupcion. */
alter session set plsql_debug = true;

set define off
set feedback on

create or replace package dvpkg_spt05 is
  type rec_t05 is record (
    num_id              dvsahet05_excepcionxpuesto.t05_id%type,
    var_cpuesto         dvsahet05_excepcionxpuesto.t05_cpuesto%type,
    num_secuencia       dvsahet05_excepcionxpuesto.t05_secuencia%type,
    var_clugartrabajo   dvsahet05_excepcionxpuesto.t05_clugartrabajo%type,
    var_estadofuncional dvsahet05_excepcionxpuesto.t05_estadofuncional%type,
    var_caccion         dvsahet05_excepcionxpuesto.t05_caccion%type,
    var_cestadoregistro dvsahet05_excepcionxpuesto.t05_cestadoregistro%type,
    var_creadopor       dvsahet05_excepcionxpuesto.t05_creadopor%type,
    dat_fcreacion       dvsahet05_excepcionxpuesto.t05_fcreacion%type,
    var_actualizadopor  dvsahet05_excepcionxpuesto.t05_actualizadopor%type,
    var_computerid      dvsahet05_excepcionxpuesto.t05_computerid%type,
    var_loginid         dvsahet05_excepcionxpuesto.t05_loginid%type
  );
  procedure cargar(avar_datos in varchar2, aclo_rpta out clob);
  procedure listar(avar_datos in varchar2, aclo_rpta out clob);
  procedure gestionar(avar_datos in varchar2, aclo_rpta out clob);
  procedure insertar(avar_datos in varchar2, aclo_rpta out clob);
  procedure obtener(avar_datos in varchar2, aclo_rpta out clob);
  procedure actualizar(avar_datos in varchar2, aclo_rpta out clob);
  procedure eliminar(avar_datos in varchar2, aclo_rpta out clob);
end dvpkg_spt05;
/

create or replace package body dvpkg_spt05 is

  lvar_sepCampo     constant char(1) := '|';
  lvar_sepRegistro  constant char(1) := chr(172);   -- ¬
  lvar_sepLista     constant char(1) := chr(166);   -- ¦
  ldat_sinFin       constant date    := to_date('31/12/9999', 'dd/mm/yyyy');

  procedure cargar(avar_datos in varchar2, aclo_rpta out clob) as
    lclo_ayudaPuestos clob;
    lclo_cboLugares   clob;
    lclo_combos       clob;
    lclo_grilla       clob;
  begin
    /* La ayuda de la lupa viaja como lista plana: |codigo|descripcion|...
       Son 568 puestos, así que se manda una vez con la carga y la lupa no
       vuelve a pedir nada. */
    select xmlagg(xmlelement(x, lvar_sepCampo, p.cpuesto, lvar_sepCampo, p.dpuesto)
                  order by p.dpuesto).extract('//text()').getclobval()
      into lclo_ayudaPuestos
      from bn_bn_hr_vi_sahe_puesto p;

    select rtrim(xmlagg(xmlelement(e, l.clugartrabajo || lvar_sepCampo || l.dlugartrabajo,
                                   lvar_sepRegistro).extract('//text()')
                        order by l.dlugartrabajo).getclobval(), lvar_sepRegistro)
      into lclo_cboLugares
      from bn_bn_hr_vi_sahe_lugartrabajo l;

    lclo_combos := lclo_cboLugares || lvar_sepLista || 'A|Activo' || lvar_sepRegistro || 'I|Inactivo';

    dvpkg_spt05.listar(avar_datos, lclo_grilla);
    if dbms_lob.substr(lclo_grilla, 2, 1) = 'E|' then
      aclo_rpta := lclo_grilla;
      return;
    end if;

    aclo_rpta := lclo_combos || '~' || lclo_grilla || '~' || lclo_ayudaPuestos;
  exception
    when others then
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  procedure listar(avar_datos in varchar2, aclo_rpta out clob) as
    lvar_mensaje varchar2(999);
    lbuffer      varchar2(32767);
    type tab_datos is table of varchar2(4000);
    ltab_datos tab_datos;
    cursor cur_datos is
      select to_char(t05.t05_id)      || lvar_sepCampo ||
             t05.t05_cpuesto          || lvar_sepCampo ||
             p.dpuesto                || lvar_sepCampo ||
             l.dlugartrabajo          || lvar_sepCampo ||
             case t05.t05_estadofuncional when 'A' then 'Activo' else 'Inactivo' end
        from dvsahet05_excepcionxpuesto t05
             inner join bn_bn_hr_vi_sahe_puesto p       on p.cpuesto       = t05.t05_cpuesto
             inner join bn_bn_hr_vi_sahe_lugartrabajo l on l.clugartrabajo = t05.t05_clugartrabajo
       where t05.t05_cestadoregistro = 'A'
       order by p.dpuesto;
  begin
    lvar_mensaje := case avar_datos when 'I' then 'C|Se grabaron con éxito los datos.~'
                                    when 'U' then 'C|Se modificaron con éxito los datos.~'
                                    when 'D' then 'C|Se eliminó con éxito el registro.~'
                                    when 'S' then 'A|No hubo cambios.~'
                                    else ''
                    end;
    dbms_lob.createtemporary(aclo_rpta, true);
    if lvar_mensaje is not null then
      dbms_lob.append(aclo_rpta, lvar_mensaje);
    end if;

    open cur_datos;
    loop
      fetch cur_datos bulk collect into ltab_datos limit 1000;
      exit when ltab_datos.count = 0;
      lbuffer := '';
      for lnum_i in 1 .. ltab_datos.count loop
        lbuffer := lbuffer || ltab_datos(lnum_i);
        if lnum_i < ltab_datos.count then
          lbuffer := lbuffer || lvar_sepRegistro;
        end if;
        if length(lbuffer) > 30000 then
          dbms_lob.append(aclo_rpta, lbuffer);
          lbuffer := '';
        end if;
      end loop;
      if lbuffer is not null then
        dbms_lob.append(aclo_rpta, lbuffer);
      end if;
    end loop;
    close cur_datos;
  exception
    when others then
      if cur_datos%isopen then
        close cur_datos;
      end if;
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  procedure gestionar(avar_datos in varchar2, aclo_rpta out clob) as
    lvar_accion varchar2(10);
    lclo_datos  clob;
  begin
    lvar_accion := substr(avar_datos, 1, instr(avar_datos, '|') - 1);
    lclo_datos  := substr(avar_datos, instr(avar_datos, '|') + 1);
    if (lvar_accion = 'I') then
      dvpkg_spt05.insertar(lclo_datos, aclo_rpta);
    elsif (lvar_accion = 'U') then
      dvpkg_spt05.actualizar(lclo_datos, aclo_rpta);
    elsif (lvar_accion = 'D') then
      dvpkg_spt05.eliminar(lclo_datos, aclo_rpta);
    else
      aclo_rpta := 'E|Acción no válida~||';
    end if;
  exception
    when others then
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  /* Lee la trama que manda la pantalla. Se separa en un solo lugar para que
     insertar, actualizar y eliminar no repitan nueve regexp_substr cada uno.
     El doble | se rellena con un espacio: sin eso regexp_substr saltea los
     campos vacíos y todo lo que sigue se corre de posición. */
  procedure leerTrama(avar_datos in varchar2, arec_t05 out rec_t05) as
  begin
    select to_number(regexp_substr(tab, '[^|]+', 1, 1))
         , trim(regexp_substr(tab, '[^|]+', 1, 2))
         , to_number(nvl(regexp_substr(tab, '[^|]+', 1, 3), '0'))
         , trim(regexp_substr(tab, '[^|]+', 1, 4))
         , trim(regexp_substr(tab, '[^|]+', 1, 5))
         , trim(regexp_substr(tab, '[^|]+', 1, 6))
         , trim(regexp_substr(tab, '[^|]+', 1, 7))
         , trim(regexp_substr(tab, '[^|]+', 1, 8))
         , trim(regexp_substr(tab, '[^|]+', 1, 9))
      into arec_t05.num_id
         , arec_t05.var_cpuesto
         , arec_t05.num_secuencia
         , arec_t05.var_clugartrabajo
         , arec_t05.var_estadofuncional
         , arec_t05.var_creadopor
         , arec_t05.var_actualizadopor
         , arec_t05.var_computerid
         , arec_t05.var_loginid
      from (select replace(replace(to_char(trim('|' || avar_datos)), '||', '| |'), '||', '| |') tab
              from dual);
  end;

  procedure insertar(avar_datos in varchar2, aclo_rpta out clob) as
    lrec_t05 rec_t05;
    ldat_fechaactual date;
  begin
    ldat_fechaactual := sysdate;
    leerTrama(avar_datos, lrec_t05);

    aclo_rpta := dvpkg_fnt05.validardatos('I', 0, lrec_t05.var_cpuesto, lrec_t05.num_secuencia
                                          , lrec_t05.var_clugartrabajo, lrec_t05.var_estadofuncional);
    if (aclo_rpta <> '00') then
      return;
    end if;

    insert into dvsahet05_excepcionxpuesto(t05_cpuesto
                                           , t05_secuencia
                                           , t05_finiefectiva
                                           , t05_ffinefectiva
                                           , t05_clugartrabajo
                                           , t05_estadofuncional
                                           , t05_caccion
                                           , t05_cestadoregistro
                                           , t05_creadopor
                                           , t05_fcreacion
                                           , t05_actualizadopor
                                           , t05_factualizacion
                                           , t05_computerid
                                           , t05_loginid)
    values(lrec_t05.var_cpuesto
           , lrec_t05.num_secuencia + 1
           , ldat_fechaactual
           , ldat_sinFin
           , lrec_t05.var_clugartrabajo
           , lrec_t05.var_estadofuncional
           , 'I'
           , 'A'
           , lrec_t05.var_creadopor
           , ldat_fechaactual
           , lrec_t05.var_actualizadopor
           , ldat_sinFin
           , lrec_t05.var_computerid
           , lrec_t05.var_loginid);
    commit;
    dvpkg_spt05.listar('I', aclo_rpta);
  exception
    when dup_val_on_index then
      rollback;
      aclo_rpta := 'E|Ese puesto ya tiene una excepción registrada en ese lugar de trabajo~' || sqlcode || '|' || sqlerrm;
    when others then
      rollback;
      aclo_rpta := 'E|No se pudo registrar los datos~' || sqlcode || '|' || sqlerrm;
  end;

  procedure obtener(avar_datos in varchar2, aclo_rpta out clob) as
    lnum_id dvsahet05_excepcionxpuesto.t05_id%type;
  begin
    lnum_id := to_number(regexp_substr(avar_datos, '[^|]+', 1, 1));
    select 'U'
           || '|' || to_char(t05.t05_id)
           || '|' || t05.t05_cpuesto
           || '|' || to_char(t05.t05_secuencia)
           || '|' || p.dpuesto
           || '|' || l.dlugartrabajo
           || '|' || case t05.t05_estadofuncional when 'A' then 'Activo' else 'Inactivo' end
           || '|' || t05.t05_creadopor
           || '|' || to_char(t05.t05_fcreacion, 'dd/mm/yyyy hh24:mi:ss')
           || '|' || t05.t05_actualizadopor
      into aclo_rpta
      from dvsahet05_excepcionxpuesto t05
           inner join bn_bn_hr_vi_sahe_puesto p       on p.cpuesto       = t05.t05_cpuesto
           inner join bn_bn_hr_vi_sahe_lugartrabajo l on l.clugartrabajo = t05.t05_clugartrabajo
     where t05.t05_cestadoregistro = 'A'
       and t05.t05_id = lnum_id;
  exception
    when no_data_found then
      aclo_rpta := 'E|El registro ya no está disponible~' || sqlcode || '|' || sqlerrm;
    when others then
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  /* Modificar y eliminar hacen lo mismo con la fila vigente: le cierran la
     vigencia. Se separa para no escribirlo dos veces. */
  procedure cerrarVigente(anum_id in number, adat_fecha in out date, arec_t05 in out rec_t05
                          , anum_filas out number) as
    ldat_inicio date;
  begin
    select t05.t05_creadopor, t05.t05_fcreacion, t05.t05_secuencia, t05.t05_finiefectiva
      into arec_t05.var_creadopor, arec_t05.dat_fcreacion, arec_t05.num_secuencia, ldat_inicio
      from dvsahet05_excepcionxpuesto t05
     where t05.t05_cestadoregistro = 'A'
       and t05.t05_id = anum_id;

    /* CHK_T0503 exige que el fin sea posterior al inicio, y sysdate solo
       tiene resolución de segundo: modificar y eliminar en el mismo segundo
       dejaba las dos fechas iguales y la baja fallaba. Se corre un segundo
       cuando hace falta, y la fila nueva arranca en ese mismo instante para
       que el histórico no quede con huecos. */
    adat_fecha := greatest(adat_fecha, ldat_inicio + (1 / 86400));

    update dvsahet05_excepcionxpuesto
       set t05_ffinefectiva = adat_fecha
         , t05_cestadoregistro = 'I'
     where t05_cestadoregistro = 'A'
       and t05_id = anum_id;
    anum_filas := sql%rowcount;
  end;

  procedure actualizar(avar_datos in varchar2, aclo_rpta out clob) as
    lrec_t05 rec_t05;
    ldat_fechaactual date;
    lnum_filas number;
  begin
    ldat_fechaactual := sysdate;
    leerTrama(avar_datos, lrec_t05);

    aclo_rpta := dvpkg_fnt05.validardatos('U', lrec_t05.num_id, lrec_t05.var_cpuesto
                                          , lrec_t05.num_secuencia, lrec_t05.var_clugartrabajo
                                          , lrec_t05.var_estadofuncional);
    if aclo_rpta = 'S' then
      dvpkg_spt05.listar('S', aclo_rpta);
      return;
    end if;
    if aclo_rpta <> '00' then
      return;
    end if;

    cerrarVigente(lrec_t05.num_id, ldat_fechaactual, lrec_t05, lnum_filas);
    if lnum_filas = 0 then
      rollback;
      aclo_rpta := 'E|No existe un registro activo para actualizar';
      return;
    end if;

    insert into dvsahet05_excepcionxpuesto(t05_cpuesto
                                           , t05_secuencia
                                           , t05_finiefectiva
                                           , t05_ffinefectiva
                                           , t05_clugartrabajo
                                           , t05_estadofuncional
                                           , t05_caccion
                                           , t05_cestadoregistro
                                           , t05_creadopor
                                           , t05_fcreacion
                                           , t05_actualizadopor
                                           , t05_factualizacion
                                           , t05_computerid
                                           , t05_loginid)
    values(lrec_t05.var_cpuesto
           , lrec_t05.num_secuencia + 1
           , ldat_fechaactual
           , ldat_sinFin
           , lrec_t05.var_clugartrabajo
           , lrec_t05.var_estadofuncional
           , 'U'
           , 'A'
           , lrec_t05.var_creadopor
           , lrec_t05.dat_fcreacion
           , lrec_t05.var_actualizadopor
           , ldat_fechaactual
           , lrec_t05.var_computerid
           , lrec_t05.var_loginid);
    commit;
    dvpkg_spt05.listar('U', aclo_rpta);
  exception
    when dup_val_on_index then
      rollback;
      aclo_rpta := 'E|Ese puesto ya tiene una excepción registrada en ese lugar de trabajo~' || sqlcode || '|' || sqlerrm;
    when no_data_found then
      rollback;
      aclo_rpta := 'E|No hay datos con los parámetros ingresados~' || sqlcode || '|' || sqlerrm;
    when others then
      rollback;
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  /* Recibe la MISMA trama que actualizar: la pantalla arma una sola, con la
     acción cambiada. Leer aquí otras posiciones -como hace T12- termina
     guardando el código del puesto en el campo de auditoría. */
  procedure eliminar(avar_datos in varchar2, aclo_rpta out clob) as
    lrec_t05 rec_t05;
    ldat_fechaactual date;
    lnum_filas number;
  begin
    ldat_fechaactual := sysdate;
    leerTrama(avar_datos, lrec_t05);

    cerrarVigente(lrec_t05.num_id, ldat_fechaactual, lrec_t05, lnum_filas);
    if lnum_filas = 0 then
      rollback;
      aclo_rpta := 'E|No existe un registro activo para eliminar';
      return;
    end if;

    /* La fila de baja queda como histórico: acción 'D' y estado 'I', para que
       no vuelva a aparecer en la grilla. */
    insert into dvsahet05_excepcionxpuesto(t05_cpuesto
                                           , t05_secuencia
                                           , t05_finiefectiva
                                           , t05_ffinefectiva
                                           , t05_clugartrabajo
                                           , t05_estadofuncional
                                           , t05_caccion
                                           , t05_cestadoregistro
                                           , t05_creadopor
                                           , t05_fcreacion
                                           , t05_actualizadopor
                                           , t05_factualizacion
                                           , t05_computerid
                                           , t05_loginid)
    values(lrec_t05.var_cpuesto
           , lrec_t05.num_secuencia + 1
           , ldat_fechaactual
           , ldat_sinFin
           , lrec_t05.var_clugartrabajo
           , lrec_t05.var_estadofuncional
           , 'D'
           , 'I'
           , lrec_t05.var_creadopor
           , lrec_t05.dat_fcreacion
           , lrec_t05.var_actualizadopor
           , ldat_fechaactual
           , lrec_t05.var_computerid
           , lrec_t05.var_loginid);
    commit;
    dvpkg_spt05.listar('D', aclo_rpta);
  exception
    when no_data_found then
      rollback;
      aclo_rpta := 'E|No hay datos con los parámetros ingresados~' || sqlcode || '|' || sqlerrm;
    when others then
      rollback;
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

end dvpkg_spt05;
/

show errors package dvpkg_spt05
show errors package body dvpkg_spt05

select object_name, object_type, status from user_objects where object_name = 'DVPKG_SPT05';
exit
