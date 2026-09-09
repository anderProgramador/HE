-- ============================================================================
-- SAHE - BN_SAHE.DVPKG_SPT16   Conceptos
--
-- Mismo contrato que DVPKG_SPT12 / DVPKG_SPT05:
--     cargar    [0] combos   lista0 = estados
--               [1] datos    filas de la grilla
--               [2] ayudas   vacío: esta pantalla no tiene lupa
--     gestionar [0] mensaje  C|.., A|.. o E|..
--               [1] datos    la grilla ya actualizada
--
-- Grilla  (mapeo 'cargar'):  Id | Concepto | Descripcion | Estado
-- obtener (controles del popup, en el orden del txt):
--     accion | id | cconcepto | secuencia | descripcion | estadofuncional |
--     creadopor | fcreacion | actualizadopor
-- gestionar (mapeo 'grabar' + lo que agrega el controlador):
--     accion | id | cconcepto | secuencia | descripcion | estadofuncional |
--     creadopor | actualizadopor | computerid | loginid
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

create or replace package dvpkg_fnt16 is
  function validardatos(avar_cestadoregistro in varchar2
                        , anum_id in number
                        , avar_cconcepto in varchar2
                        , avar_descripcion in varchar2
                        , avar_estadofuncional in varchar2)
  return varchar2;
end dvpkg_fnt16;
/

create or replace package body dvpkg_fnt16 is
  function validardatos(avar_cestadoregistro in varchar2
                        , anum_id in number
                        , avar_cconcepto in varchar2
                        , avar_descripcion in varchar2
                        , avar_estadofuncional in varchar2)
  return varchar2
  is
    lnum_cantidad number;
  begin
    if avar_cconcepto is null or trim(avar_cconcepto) is null then
      return 'V|Debe indicar el código del concepto.';
    end if;
    if length(trim(avar_cconcepto)) > 8 then
      return 'V|El código del concepto admite hasta 8 caracteres.';
    end if;
    if avar_descripcion is null or trim(avar_descripcion) is null then
      return 'V|Debe indicar la descripción del concepto.';
    end if;
    if length(replace(avar_descripcion, chr(13), '')) > 255 then
      return 'V|La descripción supera los 255 caracteres permitidos.';
    end if;
    if regexp_like(avar_descripcion, '[<>"''$|¬¦~\@*#=!]') then
      return 'V|La descripción contiene caracteres especiales no permitidos.';
    end if;
    if avar_estadofuncional not in ('A', 'I') then
      return 'V|El estado solo puede ser Activo o Inactivo.';
    end if;

    if (avar_cestadoregistro = 'I') then
      /* Misma regla que UNQ_T1601, adelantada para dar un mensaje claro. */
      select count(*)
        into lnum_cantidad
        from dvsahet16_conceptos t16
       where t16.t16_cestadoregistro = 'A'
         and upper(t16.t16_cconcepto) = upper(avar_cconcepto);
      if (lnum_cantidad > 0) then
        return 'V|Ya existe un concepto vigente con ese código.';
      end if;
      return '00';
    else
      select count(*)
        into lnum_cantidad
        from dvsahet16_conceptos t16
       where t16.t16_id = anum_id
         and t16.t16_cestadoregistro = 'A'
         and t16.t16_cconcepto = avar_cconcepto
         and t16.t16_descripcion = avar_descripcion
         and t16.t16_estadofuncional = avar_estadofuncional;
      if (lnum_cantidad > 0) then
        return 'S';
      end if;

      select count(*)
        into lnum_cantidad
        from dvsahet16_conceptos t16
       where t16.t16_cestadoregistro = 'A'
         and t16.t16_id <> anum_id
         and upper(t16.t16_cconcepto) = upper(avar_cconcepto);
      if (lnum_cantidad > 0) then
        return 'V|Ya existe un concepto vigente con ese código.';
      end if;
      return '00';
    end if;
  exception
    when others then
      return 'E|Ocurrió un problema al validar los datos~' || sqlcode || '|' || sqlerrm;
  end;
end dvpkg_fnt16;
/

create or replace package dvpkg_spt16 is
  type rec_t16 is record (
    num_id              dvsahet16_conceptos.t16_id%type,
    var_cconcepto       dvsahet16_conceptos.t16_cconcepto%type,
    num_secuencia       dvsahet16_conceptos.t16_secuencia%type,
    var_descripcion     dvsahet16_conceptos.t16_descripcion%type,
    var_estadofuncional dvsahet16_conceptos.t16_estadofuncional%type,
    var_creadopor       dvsahet16_conceptos.t16_creadopor%type,
    dat_fcreacion       dvsahet16_conceptos.t16_fcreacion%type,
    var_actualizadopor  dvsahet16_conceptos.t16_actualizadopor%type,
    var_computerid      dvsahet16_conceptos.t16_computerid%type,
    var_loginid         dvsahet16_conceptos.t16_loginid%type
  );
  procedure cargar(avar_datos in varchar2, aclo_rpta out clob);
  procedure listar(avar_datos in varchar2, aclo_rpta out clob);
  procedure gestionar(avar_datos in varchar2, aclo_rpta out clob);
  procedure insertar(avar_datos in varchar2, aclo_rpta out clob);
  procedure obtener(avar_datos in varchar2, aclo_rpta out clob);
  procedure actualizar(avar_datos in varchar2, aclo_rpta out clob);
  procedure eliminar(avar_datos in varchar2, aclo_rpta out clob);
end dvpkg_spt16;
/

create or replace package body dvpkg_spt16 is

  lvar_sepCampo    constant char(1) := '|';
  lvar_sepRegistro constant char(1) := chr(172);
  ldat_sinFin      constant date    := to_date('31/12/9999', 'dd/mm/yyyy');

  procedure cargar(avar_datos in varchar2, aclo_rpta out clob) as
    lclo_grilla clob;
  begin
    dvpkg_spt16.listar(avar_datos, lclo_grilla);
    if dbms_lob.substr(lclo_grilla, 2, 1) = 'E|' then
      aclo_rpta := lclo_grilla;
      return;
    end if;
    /* Segmento de ayudas vacío: la pantalla no tiene lupa, pero el segmento
       viaja igual para que el lector del navegador no tenga que adivinar. */
    aclo_rpta := 'A|Activo' || lvar_sepRegistro || 'I|Inactivo' || '~' || lclo_grilla || '~';
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
      select to_char(t16.t16_id)  || lvar_sepCampo ||
             t16.t16_cconcepto    || lvar_sepCampo ||
             t16.t16_descripcion  || lvar_sepCampo ||
             case t16.t16_estadofuncional when 'A' then 'Activo' else 'Inactivo' end
        from dvsahet16_conceptos t16
       where t16.t16_cestadoregistro = 'A'
       order by t16.t16_cconcepto;
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
      dvpkg_spt16.insertar(lclo_datos, aclo_rpta);
    elsif (lvar_accion = 'U') then
      dvpkg_spt16.actualizar(lclo_datos, aclo_rpta);
    elsif (lvar_accion = 'D') then
      dvpkg_spt16.eliminar(lclo_datos, aclo_rpta);
    else
      aclo_rpta := 'E|Acción no válida~||';
    end if;
  exception
    when others then
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  /* id|cconcepto|secuencia|descripcion|estadofuncional|creadopor|
     actualizadopor|computerid|loginid */
  procedure leerTrama(avar_datos in varchar2, arec_t16 out rec_t16) as
  begin
    select to_number(regexp_substr(tab, '[^|]+', 1, 1))
         , trim(regexp_substr(tab, '[^|]+', 1, 2))
         , to_number(nvl(regexp_substr(tab, '[^|]+', 1, 3), '0'))
         , replace(regexp_substr(tab, '[^|]+', 1, 4), chr(13), '')
         , trim(regexp_substr(tab, '[^|]+', 1, 5))
         , trim(regexp_substr(tab, '[^|]+', 1, 6))
         , trim(regexp_substr(tab, '[^|]+', 1, 7))
         , trim(regexp_substr(tab, '[^|]+', 1, 8))
         , trim(regexp_substr(tab, '[^|]+', 1, 9))
      into arec_t16.num_id
         , arec_t16.var_cconcepto
         , arec_t16.num_secuencia
         , arec_t16.var_descripcion
         , arec_t16.var_estadofuncional
         , arec_t16.var_creadopor
         , arec_t16.var_actualizadopor
         , arec_t16.var_computerid
         , arec_t16.var_loginid
      from (select replace(replace(to_char(trim('|' || avar_datos)), '||', '| |'), '||', '| |') tab
              from dual);
  end;

  procedure insertar(avar_datos in varchar2, aclo_rpta out clob) as
    lrec_t16 rec_t16;
    ldat_fechaactual date;
  begin
    ldat_fechaactual := sysdate;
    leerTrama(avar_datos, lrec_t16);

    aclo_rpta := dvpkg_fnt16.validardatos('I', 0, lrec_t16.var_cconcepto
                                          , lrec_t16.var_descripcion, lrec_t16.var_estadofuncional);
    if (aclo_rpta <> '00') then
      return;
    end if;

    insert into dvsahet16_conceptos(t16_cconcepto, t16_secuencia, t16_finiefectiva
                                    , t16_ffinefectiva, t16_descripcion, t16_estadofuncional
                                    , t16_caccion, t16_cestadoregistro
                                    , t16_creadopor, t16_fcreacion
                                    , t16_actualizadopor, t16_factualizacion
                                    , t16_computerid, t16_loginid)
    values(lrec_t16.var_cconcepto, lrec_t16.num_secuencia + 1, ldat_fechaactual
           , ldat_sinFin, lrec_t16.var_descripcion, lrec_t16.var_estadofuncional
           , 'I', 'A'
           , lrec_t16.var_creadopor, ldat_fechaactual
           , lrec_t16.var_actualizadopor, ldat_sinFin
           , lrec_t16.var_computerid, lrec_t16.var_loginid);
    commit;
    dvpkg_spt16.listar('I', aclo_rpta);
  exception
    when dup_val_on_index then
      rollback;
      aclo_rpta := 'E|Ya existe un concepto vigente con ese código~' || sqlcode || '|' || sqlerrm;
    when others then
      rollback;
      aclo_rpta := 'E|No se pudo registrar los datos~' || sqlcode || '|' || sqlerrm;
  end;

  procedure obtener(avar_datos in varchar2, aclo_rpta out clob) as
    lnum_id dvsahet16_conceptos.t16_id%type;
  begin
    lnum_id := to_number(regexp_substr(avar_datos, '[^|]+', 1, 1));
    select 'U'
           || '|' || to_char(t16.t16_id)
           || '|' || t16.t16_cconcepto
           || '|' || to_char(t16.t16_secuencia)
           || '|' || t16.t16_descripcion
           || '|' || case t16.t16_estadofuncional when 'A' then 'Activo' else 'Inactivo' end
           || '|' || t16.t16_creadopor
           || '|' || to_char(t16.t16_fcreacion, 'dd/mm/yyyy hh24:mi:ss')
           || '|' || t16.t16_actualizadopor
      into aclo_rpta
      from dvsahet16_conceptos t16
     where t16.t16_cestadoregistro = 'A'
       and t16.t16_id = lnum_id;
  exception
    when no_data_found then
      aclo_rpta := 'E|El registro ya no está disponible~' || sqlcode || '|' || sqlerrm;
    when others then
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  procedure cerrarVigente(anum_id in number, adat_fecha in out date, arec_t16 in out rec_t16
                          , anum_filas out number) as
    ldat_inicio date;
  begin
    select t16.t16_creadopor, t16.t16_fcreacion, t16.t16_secuencia, t16.t16_finiefectiva
      into arec_t16.var_creadopor, arec_t16.dat_fcreacion, arec_t16.num_secuencia, ldat_inicio
      from dvsahet16_conceptos t16
     where t16.t16_cestadoregistro = 'A'
       and t16.t16_id = anum_id;

    /* CHK_T1603 exige fin > inicio y sysdate tiene resolución de segundo:
       modificar y eliminar en el mismo segundo dejaría las dos fechas
       iguales. */
    adat_fecha := greatest(adat_fecha, ldat_inicio + (1 / 86400));

    update dvsahet16_conceptos
       set t16_ffinefectiva = adat_fecha
         , t16_cestadoregistro = 'I'
     where t16_cestadoregistro = 'A'
       and t16_id = anum_id;
    anum_filas := sql%rowcount;
  end;

  procedure actualizar(avar_datos in varchar2, aclo_rpta out clob) as
    lrec_t16 rec_t16;
    ldat_fechaactual date;
    lnum_filas number;
    lnum_idnuevo dvsahet16_conceptos.t16_id%type;
    lnum_reapuntadas number;
  begin
    ldat_fechaactual := sysdate;
    leerTrama(avar_datos, lrec_t16);

    aclo_rpta := dvpkg_fnt16.validardatos('U', lrec_t16.num_id, lrec_t16.var_cconcepto
                                          , lrec_t16.var_descripcion, lrec_t16.var_estadofuncional);
    if aclo_rpta = 'S' then
      dvpkg_spt16.listar('S', aclo_rpta);
      return;
    end if;
    if aclo_rpta <> '00' then
      return;
    end if;

    cerrarVigente(lrec_t16.num_id, ldat_fechaactual, lrec_t16, lnum_filas);
    if lnum_filas = 0 then
      rollback;
      aclo_rpta := 'E|No existe un registro activo para actualizar';
      return;
    end if;

    insert into dvsahet16_conceptos(t16_cconcepto, t16_secuencia, t16_finiefectiva
                                    , t16_ffinefectiva, t16_descripcion, t16_estadofuncional
                                    , t16_caccion, t16_cestadoregistro
                                    , t16_creadopor, t16_fcreacion
                                    , t16_actualizadopor, t16_factualizacion
                                    , t16_computerid, t16_loginid)
    values(lrec_t16.var_cconcepto, lrec_t16.num_secuencia + 1, ldat_fechaactual
           , ldat_sinFin, lrec_t16.var_descripcion, lrec_t16.var_estadofuncional
           , 'U', 'A'
           , lrec_t16.var_creadopor, lrec_t16.dat_fcreacion
           , lrec_t16.var_actualizadopor, ldat_fechaactual
           , lrec_t16.var_computerid, lrec_t16.var_loginid)
    returning t16_id into lnum_idnuevo;

    /* T17 referencia el concepto por su llave (BNFK_T1701) y modificar aquí
       crea una fila nueva con id nuevo: sin esto, los conceptos asignados a
       los trabajadores quedarían apuntando a la versión que se acaba de
       cerrar. Va en la misma transacción, así que o se mueven todos o no se
       mueve ninguno.
       La operación vive en DVPKG_SPT17 porque es su tabla: aquí solo se pide. */
    dvpkg_spt17.reapuntar(lrec_t16.num_id, lnum_idnuevo, lnum_reapuntadas);

    commit;
    dvpkg_spt16.listar('U', aclo_rpta);
  exception
    when dup_val_on_index then
      rollback;
      aclo_rpta := 'E|Ya existe un concepto vigente con ese código~' || sqlcode || '|' || sqlerrm;
    when no_data_found then
      rollback;
      aclo_rpta := 'E|No hay datos con los parámetros ingresados~' || sqlcode || '|' || sqlerrm;
    when others then
      rollback;
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  /* Recibe la misma trama que actualizar, que es lo que manda la pantalla. */
  procedure eliminar(avar_datos in varchar2, aclo_rpta out clob) as
    lrec_t16 rec_t16;
    ldat_fechaactual date;
    lnum_filas number;
    lnum_usos number;
  begin
    ldat_fechaactual := sysdate;
    leerTrama(avar_datos, lrec_t16);

    /* Un concepto en uso no se da de baja: dejaría filas de T17 apuntando a
       algo que ya no existe, y esas filas son importes de trabajadores. */
    select count(*)
      into lnum_usos
      from dvsahet17_conceptoxtrabajador t17
     where t17.t17_cestadoregistro = 'A'
       and t17.t17_t16_id = lrec_t16.num_id;
    if lnum_usos > 0 then
      aclo_rpta := 'A|El concepto no se puede eliminar: lo tienen asignado ' || lnum_usos || ' trabajadores.';
      return;
    end if;

    cerrarVigente(lrec_t16.num_id, ldat_fechaactual, lrec_t16, lnum_filas);
    if lnum_filas = 0 then
      rollback;
      aclo_rpta := 'E|No existe un registro activo para eliminar';
      return;
    end if;

    insert into dvsahet16_conceptos(t16_cconcepto, t16_secuencia, t16_finiefectiva
                                    , t16_ffinefectiva, t16_descripcion, t16_estadofuncional
                                    , t16_caccion, t16_cestadoregistro
                                    , t16_creadopor, t16_fcreacion
                                    , t16_actualizadopor, t16_factualizacion
                                    , t16_computerid, t16_loginid)
    values(lrec_t16.var_cconcepto, lrec_t16.num_secuencia + 1, ldat_fechaactual
           , ldat_sinFin, lrec_t16.var_descripcion, lrec_t16.var_estadofuncional
           , 'D', 'I'
           , lrec_t16.var_creadopor, lrec_t16.dat_fcreacion
           , lrec_t16.var_actualizadopor, ldat_fechaactual
           , lrec_t16.var_computerid, lrec_t16.var_loginid);
    commit;
    dvpkg_spt16.listar('D', aclo_rpta);
  exception
    when no_data_found then
      rollback;
      aclo_rpta := 'E|No hay datos con los parámetros ingresados~' || sqlcode || '|' || sqlerrm;
    when others then
      rollback;
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

end dvpkg_spt16;
/

show errors package dvpkg_fnt16
show errors package body dvpkg_fnt16
show errors package dvpkg_spt16
show errors package body dvpkg_spt16

select object_name, object_type, status from user_objects
 where object_name in ('DVPKG_SPT16','DVPKG_FNT16') order by 1, 2;
exit
