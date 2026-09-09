-- ============================================================================
-- SAHE - BN_SAHE.DVPKG_FNT05
--   Validaciones de Excepción por Puesto. Mismo contrato que DVPKG_FNT12:
--     '00'    los datos son válidos
--     'S'     no cambió nada respecto de lo grabado (solo en 'U')
--     'V|..'  el dato no pasa una regla; el mensaje va al usuario
--     'E|..'  falló la comprobación
--
--   Ejecutar con:  set NLS_LANG=SPANISH_PERU.AL32UTF8
--   La base es WE8MSWIN1252 y el archivo está en UTF-8; sin esa variable las
--   tildes de los mensajes se guardan mal.
-- ============================================================================

@D:\DValenzuela\Desarrollo\BN\Repositorio\Claude\FuentesSAHE\BaseDatos\conn_sahe.sql

/* Se compila con informacion de depuracion. Un 'create or replace' toma el
   PLSQL_DEBUG de la sesion, y en sqlplus por omision es FALSE: sin esto, el
   paquete queda VALID pero el depurador no puede entrar, y eso solo se
   descubre cuando hace falta poner un punto de interrupcion. */
alter session set plsql_debug = true;

set define off
set feedback on

create or replace package dvpkg_fnt05 is
  function validardatos(avar_cestadoregistro in varchar2
                        , anum_id in number
                        , avar_cpuesto in varchar2
                        , anum_secuencia in number
                        , avar_clugartrabajo in varchar2
                        , avar_estadofuncional in varchar2)
  return varchar2;
end dvpkg_fnt05;
/

create or replace package body dvpkg_fnt05 is
  function validardatos(avar_cestadoregistro in varchar2
                        , anum_id in number
                        , avar_cpuesto in varchar2
                        , anum_secuencia in number
                        , avar_clugartrabajo in varchar2
                        , avar_estadofuncional in varchar2)
  return varchar2
  is
    lnum_cantidad number;
  begin
    if avar_cpuesto is null or trim(avar_cpuesto) is null then
      return 'V|Debe indicar el puesto.';
    end if;
    if avar_clugartrabajo is null or trim(avar_clugartrabajo) is null then
      return 'V|Debe indicar el lugar de trabajo.';
    end if;
    if avar_estadofuncional not in ('A', 'I') then
      return 'V|El estado solo puede ser Activo o Inactivo.';
    end if;

    /* El puesto y el lugar vienen de catálogos externos: si el usuario manda
       un código que ya no existe, conviene decirlo aquí y no dejar que la
       pantalla muestre una fila sin descripción. */
    select count(*)
      into lnum_cantidad
      from bn_bn_hr_vi_sahe_puesto p
     where p.cpuesto = avar_cpuesto;
    if lnum_cantidad = 0 then
      return 'V|El puesto indicado no figura en el catálogo de puestos.';
    end if;

    select count(*)
      into lnum_cantidad
      from bn_bn_hr_vi_sahe_lugartrabajo l
     where l.clugartrabajo = avar_clugartrabajo;
    if lnum_cantidad = 0 then
      return 'V|El lugar de trabajo indicado no existe.';
    end if;

    if (avar_cestadoregistro = 'I') then
      /* Un puesto no puede estar exceptuado dos veces en el mismo lugar. Es
         la misma regla que impone UNQ_T0501; aquí se adelanta para dar un
         mensaje entendible en lugar de un ORA-00001. */
      select count(*)
        into lnum_cantidad
        from dvsahet05_excepcionxpuesto t05
       where t05.t05_cestadoregistro = 'A'
         and t05.t05_cpuesto = avar_cpuesto
         and t05.t05_clugartrabajo = avar_clugartrabajo;
      if (lnum_cantidad > 0) then
        return 'V|Ese puesto ya tiene una excepción registrada en ese lugar de trabajo.';
      end if;
      return '00';
    else
      /* Modificación: primero, si no cambió nada, se avisa y no se toca la
         base; después, que el cambio no choque con OTRA fila activa. */
      select count(*)
        into lnum_cantidad
        from dvsahet05_excepcionxpuesto t05
       where t05.t05_id = anum_id
         and t05.t05_cestadoregistro = 'A'
         and t05.t05_cpuesto = avar_cpuesto
         and t05.t05_clugartrabajo = avar_clugartrabajo
         and t05.t05_estadofuncional = avar_estadofuncional;
      if (lnum_cantidad > 0) then
        return 'S';
      end if;

      select count(*)
        into lnum_cantidad
        from dvsahet05_excepcionxpuesto t05
       where t05.t05_cestadoregistro = 'A'
         and t05.t05_id <> anum_id
         and t05.t05_cpuesto = avar_cpuesto
         and t05.t05_clugartrabajo = avar_clugartrabajo;
      if (lnum_cantidad > 0) then
        return 'V|Ese puesto ya tiene una excepción registrada en ese lugar de trabajo.';
      end if;
      return '00';
    end if;
  exception
    when others then
      return 'E|Ocurrió un problema al validar los datos~' || sqlcode || '|' || sqlerrm;
  end;
end dvpkg_fnt05;
/

show errors package dvpkg_fnt05
show errors package body dvpkg_fnt05

select object_name, object_type, status from user_objects where object_name = 'DVPKG_FNT05';
exit
