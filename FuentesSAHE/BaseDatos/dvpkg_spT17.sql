-- ============================================================================
-- SAHE - BN_SAHE.DVPKG_SPT17   Concepto por Trabajador
--
-- Pantalla maestro-detalle: la grilla principal muestra el CONSOLIDADO -una
-- fila por trabajador con la suma de sus conceptos- y la ventana de
-- mantenimiento edita el detalle, varias líneas a la vez.
--
-- CONTRATO CON LA PANTALLA
--
--   cargar 'C<sep>2000'            combos ~ primer bloque ~ ayudas ~ total
--   cargar 'B<sep>0332933<sep>2000'  el bloque que sigue de ese trabajador
--
--     [0] combos   lista0 = conceptos vigentes (T16_ID | código - descripción)
--     [1] datos    ctrabajador | dtrabajador | importe | importeanterior
--     [2] ayudas   catálogo de trabajadores para la lupa, lista plana
--     [3] total    cuántos trabajadores hay, para la carga por bloques
--
--   obtener '0332933'
--     [0] cabecera  U | ctrabajador | dtrabajador
--     [1] detalle   id|t16id|secuencia|importe|importeanterior|fcambio|
--                   creadopor|actualizadopor   -y una línea por ¬-
--
--   gestionar  data = <accion>|<ctrabajador>|<computerid>|<loginid>
--              y, cuando hay detalle, el controlador engancha detrás del ¯:
--              <accion>|<id>|<t16id>|<importe>|<fcambio> ¬ ...
--
--     I   alta del trabajador con sus conceptos
--     U   modificación: solo llegan las líneas nuevas y las cambiadas
--     D   baja de TODOS los conceptos del trabajador
--     DD  baja de UNA línea, que la pantalla manda en el momento
--
-- LO QUE NO VIENE DE LA PANTALLA
-- El importe anterior, la secuencia y el creador se leen de la fila que se
-- está cerrando. Si el concepto vale 100 y pasa a 120, el 100 sale de la base
-- y no del navegador: así dos usuarios trabajando a la vez no pueden grabar un
-- anterior desactualizado.
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

create or replace package dvpkg_fnt17 is
  function validardatos(avar_caccion in varchar2
                        , anum_id in number
                        , avar_ctrabajador in varchar2
                        , anum_t16id in number
                        , anum_importe in number)
  return varchar2;
end dvpkg_fnt17;
/

create or replace package body dvpkg_fnt17 is
  function validardatos(avar_caccion in varchar2
                        , anum_id in number
                        , avar_ctrabajador in varchar2
                        , anum_t16id in number
                        , anum_importe in number)
  return varchar2
  is
    lnum_cantidad number;
  begin
    if avar_ctrabajador is null or trim(avar_ctrabajador) is null then
      return 'V|Debe indicar el trabajador.';
    end if;
    if anum_t16id is null or anum_t16id = 0 then
      return 'V|Debe indicar el concepto.';
    end if;
    if anum_importe is null or anum_importe < 0 then
      return 'V|El importe no puede ser negativo.';
    end if;

    /* La llave foránea garantiza que el concepto exista, pero no que sea la
       versión vigente: eso se comprueba aparte. */
    select count(*)
      into lnum_cantidad
      from dvsahet16_conceptos t16
     where t16.t16_id = anum_t16id
       and t16.t16_cestadoregistro = 'A';
    if lnum_cantidad = 0 then
      return 'V|El concepto indicado no existe o ya no está vigente.';
    end if;

    /* Un trabajador no puede tener el mismo concepto dos veces. Es la regla de
       UNQ_T1701, adelantada para dar un mensaje entendible en vez de un
       ORA-00001 con el nombre del índice. Al modificar, la propia línea no
       cuenta como repetida. */
    select count(*)
      into lnum_cantidad
      from dvsahet17_conceptoxtrabajador t17
     where t17.t17_cestadoregistro = 'A'
       and t17.t17_ctrabajador = avar_ctrabajador
       and t17.t17_t16_id = anum_t16id
       and (anum_id is null or anum_id = 0 or t17.t17_id <> anum_id);
    if lnum_cantidad > 0 then
      return 'V|Ese trabajador ya tiene asignado ese concepto.';
    end if;

    return '00';
  exception
    when others then
      return 'E|Ocurrió un problema al validar los datos~' || sqlcode || '|' || sqlerrm;
  end;
end dvpkg_fnt17;
/

create or replace package dvpkg_spt17 is
  procedure cargar(avar_datos in varchar2, aclo_rpta out clob);
  procedure listar(avar_datos in varchar2, aclo_rpta out clob);
  procedure obtener(avar_datos in varchar2, aclo_rpta out clob);
  procedure gestionar(avar_datos in varchar2, aclo_rpta out clob);
  function  contar return number;
  /* La usa DVPKG_SPT16 cuando un concepto cambia de versión. */
  procedure reapuntar(anum_idviejo in number, anum_idnuevo in number, anum_filas out number);
end dvpkg_spt17;
/

create or replace package body dvpkg_spt17 is

  lvar_sepCampo    constant char(1) := '|';
  lvar_sepRegistro constant char(1) := chr(172);   -- ¬
  lvar_sepLista    constant char(1) := chr(166);   -- ¦
  lvar_sepDetalle  constant char(1) := chr(175);   -- ¯  lo pone el controlador
  ldat_sinFin      constant date    := to_date('31/12/9999', 'dd/mm/yyyy');

  /* Los importes viajan SIEMPRE con punto decimal. Sin el tercer argumento,
     to_char usa el separador de la sesión y la misma consulta devuelve
     '5141.92' o '5141,92' según con qué NLS se conecte el aplicativo. */
  lvar_formato     constant varchar2(30) := 'FM99999999990.00';
  lvar_nlsPunto    constant varchar2(40) := 'NLS_NUMERIC_CHARACTERS=''.,''';

  lnum_bloqueMin constant number := 100;
  lnum_bloqueMax constant number := 5000;
  lnum_bloqueDef constant number := 1000;

  /* El to_char va escrito completo en cada consulta: una función declarada
     solo en el cuerpo del paquete no se puede llamar desde SQL. */

  /* La acción y sus parámetros viajan separados por el separador de registro:
     'B<sep>0332933<sep>2000'. Devuelve la parte n, contando desde 1. */
  function parte(avar_datos in varchar2, anum_n in number) return varchar2 is
  begin
    return trim(regexp_substr(avar_datos, '[^' || lvar_sepRegistro || ']+', 1, anum_n));
  end;

  function tamanoDe(avar_datos in varchar2, anum_n in number) return number is
    lnum number;
  begin
    lnum := to_number(parte(avar_datos, anum_n));
    if lnum is null then
      return lnum_bloqueDef;
    end if;
    return least(greatest(lnum, lnum_bloqueMin), lnum_bloqueMax);
  exception
    when others then
      return lnum_bloqueDef;
  end;

  /* Cuántos TRABAJADORES hay, que es lo que cuenta la grilla consolidada. La
     pantalla lo usa para saber cuántos viajes le faltan. */
  function contar return number is
    lnum number;
  begin
    select count(distinct t17.t17_ctrabajador)
      into lnum
      from dvsahet17_conceptoxtrabajador t17
     where t17.t17_cestadoregistro = 'A';
    return lnum;
  end;

  -- ======================================================== cargar =========

  procedure cargar(avar_datos in varchar2, aclo_rpta out clob) as
    lclo_conceptos clob;
    lclo_ayuda     clob;
    lclo_grilla    clob;
  begin
    /* Los conceptos vigentes, con el T16_ID como valor: es lo que se graba y
       lo que el combo del detalle guarda en la celda. */
    select rtrim(xmlagg(xmlelement(e, to_char(t16.t16_id) || lvar_sepCampo
                                      || t16.t16_cconcepto || ' - ' || t16.t16_descripcion,
                                   lvar_sepRegistro).extract('//text()')
                        order by t16.t16_cconcepto).getclobval(), lvar_sepRegistro)
      into lclo_conceptos
      from dvsahet16_conceptos t16
     where t16.t16_cestadoregistro = 'A'
       and t16.t16_estadofuncional = 'A';

    /* La ayuda de la lupa: los trabajadores que ya tienen conceptos. Va como
       lista plana -|código|nombre|código|nombre...-, que es la forma que la
       pantalla sabe agrupar. */
    select xmlagg(xmlelement(x, lvar_sepCampo, t.t17_ctrabajador, lvar_sepCampo, ed.dtrabajador)
                  order by ed.dtrabajador).extract('//text()').getclobval()
      into lclo_ayuda
      from (select distinct t17.t17_ctrabajador
              from dvsahet17_conceptoxtrabajador t17
             where t17.t17_cestadoregistro = 'A') t
           inner join bn_bn_hr_vi_sahe_empdatos ed on ed.ctrabajador = t.t17_ctrabajador;

    dvpkg_spt17.listar(avar_datos, lclo_grilla);
    if dbms_lob.substr(lclo_grilla, 2, 1) = 'E|' then
      aclo_rpta := lclo_grilla;
      return;
    end if;

    aclo_rpta := lclo_conceptos || '~' || lclo_grilla || '~' || lclo_ayuda
                 || '~' || to_char(dvpkg_spt17.contar);
  exception
    when others then
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  -- ======================================================== listar =========

  procedure listar(avar_datos in varchar2, aclo_rpta out clob) as
    lvar_mensaje varchar2(999);
    lvar_accion  varchar2(10);
    lvar_desde   varchar2(10);
    lnum_tamano  number;
    lbuffer      varchar2(32767);
    type tab_datos is table of varchar2(4000);
    ltab_datos tab_datos;
    /* Se pagina por LLAVE -"lo que sigue de este trabajador"- y no por OFFSET:
       con OFFSET, Oracle lee y descarta las filas anteriores y el bloque 18
       costaría 18 veces lo que el primero. */
    cursor cur_datos(pvar_desde varchar2, pnum_tamano number) is
      select t17.t17_ctrabajador                       || lvar_sepCampo ||
             ed.dtrabajador                            || lvar_sepCampo ||
             to_char(sum(t17.t17_importe), 'FM99999999990.00', 'NLS_NUMERIC_CHARACTERS=''.,''')
                                                       || lvar_sepCampo ||
             to_char(sum(t17.t17_importeanterior), 'FM99999999990.00', 'NLS_NUMERIC_CHARACTERS=''.,''')
        from dvsahet17_conceptoxtrabajador t17
             inner join bn_bn_hr_vi_sahe_empdatos ed on ed.ctrabajador = t17.t17_ctrabajador
       where t17.t17_cestadoregistro = 'A'
         and t17.t17_ctrabajador > pvar_desde
       group by t17.t17_ctrabajador, ed.dtrabajador
       order by t17.t17_ctrabajador
       fetch first pnum_tamano rows only;
  begin
    lvar_accion := nvl(parte(avar_datos, 1), avar_datos);
    if lvar_accion = 'B' then
      lvar_desde  := nvl(parte(avar_datos, 2), ' ');
      lnum_tamano := tamanoDe(avar_datos, 3);
    else
      lvar_desde  := ' ';
      lnum_tamano := tamanoDe(avar_datos, 2);
    end if;

    lvar_mensaje := case lvar_accion when 'I' then 'C|Se grabaron con éxito los datos.~'
                                     when 'U' then 'C|Se modificaron con éxito los datos.~'
                                     when 'D' then 'C|Se eliminó con éxito el registro.~'
                                     when 'S' then 'A|No hubo cambios.~'
                                     else ''
                    end;
    dbms_lob.createtemporary(aclo_rpta, true);
    if lvar_mensaje is not null then
      dbms_lob.append(aclo_rpta, lvar_mensaje);
    end if;

    open cur_datos(lvar_desde, lnum_tamano);
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

  -- ======================================================= obtener =========

  procedure obtener(avar_datos in varchar2, aclo_rpta out clob) as
    lvar_ctrabajador dvsahet17_conceptoxtrabajador.t17_ctrabajador%type;
    lvar_dtrabajador varchar2(200);
    lclo_detalle     clob;
  begin
    lvar_ctrabajador := trim(regexp_substr(avar_datos, '[^|]+', 1, 1));

    select ed.dtrabajador
      into lvar_dtrabajador
      from bn_bn_hr_vi_sahe_empdatos ed
     where ed.ctrabajador = lvar_ctrabajador;

    /* El detalle, en el mismo orden que declara 'campos=' de la línea detalle
       del T17.txt. Si ese orden cambia, hay que moverlo también aquí. */
    select rtrim(xmlagg(xmlelement(e,
                   to_char(t17.t17_id)              || lvar_sepCampo ||
                   to_char(t17.t17_t16_id)          || lvar_sepCampo ||
                   to_char(t17.t17_secuencia)       || lvar_sepCampo ||
                   to_char(t17.t17_importe, 'FM99999999990.00', 'NLS_NUMERIC_CHARACTERS=''.,''')
                                                    || lvar_sepCampo ||
                   to_char(t17.t17_importeanterior, 'FM99999999990.00', 'NLS_NUMERIC_CHARACTERS=''.,''')
                                                    || lvar_sepCampo ||
                   to_char(t17.t17_fcambio, 'yyyy-mm-dd') || lvar_sepCampo ||
                   t17.t17_creadopor                || lvar_sepCampo ||
                   t17.t17_actualizadopor,
                   lvar_sepRegistro).extract('//text()')
                 order by t16.t16_cconcepto).getclobval(), lvar_sepRegistro)
      into lclo_detalle
      from dvsahet17_conceptoxtrabajador t17
           inner join dvsahet16_conceptos t16 on t16.t16_id = t17.t17_t16_id
     where t17.t17_cestadoregistro = 'A'
       and t17.t17_ctrabajador = lvar_ctrabajador;

    aclo_rpta := 'U' || lvar_sepCampo || lvar_ctrabajador || lvar_sepCampo || lvar_dtrabajador
                 || '~' || lclo_detalle;
  exception
    when no_data_found then
      aclo_rpta := 'E|El trabajador ya no está disponible~' || sqlcode || '|' || sqlerrm;
    when others then
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  -- ====================================================== gestionar ========

  /* Cierra la fila vigente y devuelve lo que hay que arrastrar a la versión
     nueva: el importe que tenía -que pasa a ser el anterior-, la secuencia,
     el creador y su fecha. Es la razón por la que la pantalla no manda esos
     campos: acá está la verdad. */
  procedure cerrarVigente(anum_id in number
                          , adat_fecha in out date
                          , anum_importeprevio out number
                          , anum_secuencia out number
                          , avar_creadopor out varchar2
                          , adat_fcreacion out date
                          , anum_t16id out number
                          , avar_ctrabajador out varchar2
                          , anum_filas out number) as
    ldat_inicio date;
  begin
    select t17.t17_importe, t17.t17_secuencia, t17.t17_creadopor, t17.t17_fcreacion
         , t17.t17_t16_id, t17.t17_ctrabajador, t17.t17_finiefectiva
      into anum_importeprevio, anum_secuencia, avar_creadopor, adat_fcreacion
         , anum_t16id, avar_ctrabajador, ldat_inicio
      from dvsahet17_conceptoxtrabajador t17
     where t17.t17_cestadoregistro = 'A'
       and t17.t17_id = anum_id;

    /* CHK_T1703 exige que el fin sea posterior al inicio, y sysdate solo tiene
       resolución de segundo: modificar y eliminar en el mismo segundo dejaría
       las dos fechas iguales. */
    adat_fecha := greatest(adat_fecha, ldat_inicio + (1 / 86400));

    update dvsahet17_conceptoxtrabajador
       set t17_ffinefectiva = adat_fecha
         , t17_cestadoregistro = 'I'
     where t17_cestadoregistro = 'A'
       and t17_id = anum_id;
    anum_filas := sql%rowcount;
  end;

  procedure insertarLinea(avar_ctrabajador in varchar2
                          , anum_secuencia in number
                          , anum_t16id in number
                          , anum_importe in number
                          , anum_importeanterior in number
                          , adat_fcambio in date
                          , avar_caccion in varchar2
                          , avar_cestadoregistro in varchar2
                          , avar_creadopor in varchar2
                          , adat_fcreacion in date
                          , avar_actualizadopor in varchar2
                          , avar_computerid in varchar2
                          , avar_loginid in varchar2
                          , adat_fecha in date) as
  begin
    insert into dvsahet17_conceptoxtrabajador(t17_ctrabajador, t17_secuencia, t17_t16_id
                                              , t17_finiefectiva, t17_ffinefectiva
                                              , t17_importe, t17_importeanterior, t17_fcambio
                                              , t17_estadofuncional, t17_caccion, t17_cestadoregistro
                                              , t17_creadopor, t17_fcreacion
                                              , t17_actualizadopor, t17_factualizacion
                                              , t17_computerid, t17_loginid)
    values(avar_ctrabajador, anum_secuencia, anum_t16id
           , adat_fecha, ldat_sinFin
           , anum_importe, anum_importeanterior, adat_fcambio
           , 'A', avar_caccion, avar_cestadoregistro
           , avar_creadopor, adat_fcreacion
           , avar_actualizadopor, adat_fecha
           , avar_computerid, avar_loginid);
  end;

  /* Una línea del detalle: 'I|id|t16id|importe|fcambio' o 'U|...'.
     Solo llegan las nuevas y las modificadas. */
  procedure procesarLinea(avar_linea in varchar2
                          , avar_ctrabajador in varchar2
                          , avar_computerid in varchar2
                          , avar_loginid in varchar2
                          , adat_fecha in date
                          , avar_rpta out varchar2) as
    lvar_accion   varchar2(4);
    lvar_relleno  varchar2(4000);
    lnum_id       number;
    lnum_t16id    number;
    lnum_importe  number;
    ldat_fcambio  date;

    lnum_previo     number;
    lnum_secuencia  number;
    lvar_creadopor  dvsahet17_conceptoxtrabajador.t17_creadopor%type;
    ldat_fcreacion  date;
    lnum_t16viejo   number;
    lvar_trabviejo  dvsahet17_conceptoxtrabajador.t17_ctrabajador%type;
    lnum_filas      number;
    ldat_cierre     date;
  begin
    /* regexp_substr con '[^|]+' SALTEA los campos vacíos, y una línea nueva
       llega justamente con el id vacío: sin este relleno, el concepto se leería
       en la posición del id y todo lo demás quedaría corrido. Es el mismo
       recurso que usan los otros paquetes. */
    lvar_relleno := replace(replace(avar_linea, '||', '| |'), '||', '| |');

    lvar_accion  := trim(regexp_substr(lvar_relleno, '[^|]+', 1, 1));
    lnum_id      := to_number(nvl(trim(regexp_substr(lvar_relleno, '[^|]+', 1, 2)), '0'));
    lnum_t16id   := to_number(nvl(trim(regexp_substr(lvar_relleno, '[^|]+', 1, 3)), '0'));
    /* El importe viaja SIEMPRE con punto decimal, así que se lee con punto
       decimal: sin el tercer argumento, to_number usaría el separador de la
       sesión y '4917.92' fallaría en una sesión en español. */
    lnum_importe := to_number(nvl(trim(regexp_substr(lvar_relleno, '[^|]+', 1, 4)), '0')
                              , lvar_formato, lvar_nlsPunto);
    ldat_fcambio := nvl(to_date(trim(regexp_substr(lvar_relleno, '[^|]+', 1, 5)), 'yyyy-mm-dd'), adat_fecha);

    avar_rpta := dvpkg_fnt17.validardatos(lvar_accion, lnum_id, avar_ctrabajador, lnum_t16id, lnum_importe);
    if avar_rpta <> '00' then
      return;
    end if;

    if lvar_accion = 'I' then
      insertarLinea(avar_ctrabajador, 1, lnum_t16id, lnum_importe, 0, ldat_fcambio
                    , 'I', 'A', avar_loginid, adat_fecha, avar_loginid
                    , avar_computerid, avar_loginid, adat_fecha);
      return;
    end if;

    /* Modificación: se cierra la vigente y la versión nueva hereda de ella el
       importe anterior, la secuencia y el creador. */
    ldat_cierre := adat_fecha;
    cerrarVigente(lnum_id, ldat_cierre, lnum_previo, lnum_secuencia, lvar_creadopor
                  , ldat_fcreacion, lnum_t16viejo, lvar_trabviejo, lnum_filas);
    if lnum_filas = 0 then
      avar_rpta := 'E|La línea que intenta modificar ya no está vigente';
      return;
    end if;

    insertarLinea(avar_ctrabajador, lnum_secuencia + 1, lnum_t16id, lnum_importe
                  , lnum_previo, ldat_fcambio
                  , 'U', 'A', lvar_creadopor, ldat_fcreacion, avar_loginid
                  , avar_computerid, avar_loginid, ldat_cierre);
    avar_rpta := '00';
  end;

  /* Baja de UNA línea: llega 'DD|id|computerid|loginid' desde la grilla del
     detalle, en el momento en que el usuario la quita. */
  procedure eliminarLinea(avar_datos in varchar2, aclo_rpta out clob) as
    lvar_relleno   varchar2(4000);
    lnum_id        number;
    lvar_computerid varchar2(99);
    lvar_loginid    varchar2(99);
    lnum_previo     number;
    lnum_secuencia  number;
    lvar_creadopor  dvsahet17_conceptoxtrabajador.t17_creadopor%type;
    ldat_fcreacion  date;
    lnum_t16id      number;
    lvar_ctrabajador dvsahet17_conceptoxtrabajador.t17_ctrabajador%type;
    lnum_filas      number;
    ldat_fecha      date;
  begin
    lvar_relleno    := replace(replace(avar_datos, '||', '| |'), '||', '| |');
    lnum_id         := to_number(nvl(trim(regexp_substr(lvar_relleno, '[^|]+', 1, 2)), '0'));
    lvar_computerid := trim(regexp_substr(lvar_relleno, '[^|]+', 1, 3));
    lvar_loginid    := trim(regexp_substr(lvar_relleno, '[^|]+', 1, 4));
    ldat_fecha      := sysdate;

    cerrarVigente(lnum_id, ldat_fecha, lnum_previo, lnum_secuencia, lvar_creadopor
                  , ldat_fcreacion, lnum_t16id, lvar_ctrabajador, lnum_filas);
    if lnum_filas = 0 then
      rollback;
      aclo_rpta := 'E|La línea que intenta eliminar ya no está vigente';
      return;
    end if;

    /* La fila de baja queda como histórico: acción 'D' y estado 'I', para que
       no vuelva a aparecer. */
    insertarLinea(lvar_ctrabajador, lnum_secuencia + 1, lnum_t16id, lnum_previo
                  , lnum_previo, ldat_fecha
                  , 'D', 'I', lvar_creadopor, ldat_fcreacion, lvar_loginid
                  , lvar_computerid, lvar_loginid, ldat_fecha);
    commit;
    aclo_rpta := 'C|Se eliminó el concepto.';
  exception
    when others then
      rollback;
      aclo_rpta := 'E|No se pudo eliminar la línea~' || sqlcode || '|' || sqlerrm;
  end;

  /* Baja de TODOS los conceptos del trabajador, desde la grilla principal. */
  procedure eliminarTrabajador(avar_ctrabajador in varchar2
                               , avar_computerid in varchar2
                               , avar_loginid in varchar2
                               , aclo_rpta out clob) as
    lnum_previo     number;
    lnum_secuencia  number;
    lvar_creadopor  dvsahet17_conceptoxtrabajador.t17_creadopor%type;
    ldat_fcreacion  date;
    lnum_t16id      number;
    lvar_trab       dvsahet17_conceptoxtrabajador.t17_ctrabajador%type;
    lnum_filas      number;
    ldat_fecha      date;
    lnum_cuantas    number := 0;
    cursor cur_ids is
      select t17.t17_id
        from dvsahet17_conceptoxtrabajador t17
       where t17.t17_cestadoregistro = 'A'
         and t17.t17_ctrabajador = avar_ctrabajador;
  begin
    ldat_fecha := sysdate;
    for r in cur_ids loop
      cerrarVigente(r.t17_id, ldat_fecha, lnum_previo, lnum_secuencia, lvar_creadopor
                    , ldat_fcreacion, lnum_t16id, lvar_trab, lnum_filas);
      if lnum_filas > 0 then
        insertarLinea(avar_ctrabajador, lnum_secuencia + 1, lnum_t16id, lnum_previo
                      , lnum_previo, ldat_fecha
                      , 'D', 'I', lvar_creadopor, ldat_fcreacion, avar_loginid
                      , avar_computerid, avar_loginid, ldat_fecha);
        lnum_cuantas := lnum_cuantas + 1;
      end if;
      ldat_fecha := sysdate;
    end loop;

    if lnum_cuantas = 0 then
      rollback;
      aclo_rpta := 'A|El trabajador ya no tiene conceptos vigentes.';
      return;
    end if;
    commit;
    dvpkg_spt17.listar('D' || lvar_sepRegistro || to_char(lnum_bloqueDef), aclo_rpta);
  exception
    when others then
      rollback;
      aclo_rpta := 'E|No se pudo eliminar los conceptos del trabajador~' || sqlcode || '|' || sqlerrm;
  end;

  procedure gestionar(avar_datos in varchar2, aclo_rpta out clob) as
    lvar_cabecera   varchar2(4000);
    lclo_detalle    clob;
    lvar_accion     varchar2(4);
    lvar_ctrabajador dvsahet17_conceptoxtrabajador.t17_ctrabajador%type;
    lvar_computerid varchar2(99);
    lvar_loginid    varchar2(99);
    lnum_corte      number;
    lvar_linea      varchar2(4000);
    lvar_rpta       varchar2(4000);
    ldat_fecha      date;
    lnum_i          number := 1;
    lnum_grabadas   number := 0;
  begin
    /* El controlador engancha el detalle detrás del ¯; antes de eso está la
       cabecera con su auditoría. */
    lnum_corte := instr(avar_datos, lvar_sepDetalle);
    if lnum_corte = 0 then
      lvar_cabecera := avar_datos;
      lclo_detalle  := null;
    else
      lvar_cabecera := substr(avar_datos, 1, lnum_corte - 1);
      lclo_detalle  := substr(avar_datos, lnum_corte + 1);
    end if;

    lvar_cabecera    := replace(replace(lvar_cabecera, '||', '| |'), '||', '| |');
    lvar_accion      := trim(regexp_substr(lvar_cabecera, '[^|]+', 1, 1));
    lvar_ctrabajador := trim(regexp_substr(lvar_cabecera, '[^|]+', 1, 2));
    lvar_computerid  := trim(regexp_substr(lvar_cabecera, '[^|]+', 1, 3));
    lvar_loginid     := trim(regexp_substr(lvar_cabecera, '[^|]+', 1, 4));

    if lvar_accion = 'DD' then
      /* Aquí la posición 2 es el id de la línea, no el trabajador. */
      eliminarLinea(lvar_cabecera, aclo_rpta);
      return;
    end if;

    if lvar_accion = 'D' then
      eliminarTrabajador(lvar_ctrabajador, lvar_computerid, lvar_loginid, aclo_rpta);
      return;
    end if;

    if lvar_accion not in ('I', 'U') then
      aclo_rpta := 'E|Acción no válida~||';
      return;
    end if;

    if lclo_detalle is null or dbms_lob.getlength(lclo_detalle) = 0 then
      aclo_rpta := 'A|No hay líneas que grabar.';
      return;
    end if;

    ldat_fecha := sysdate;
    loop
      lvar_linea := trim(regexp_substr(lclo_detalle, '[^' || lvar_sepRegistro || ']+', 1, lnum_i));
      exit when lvar_linea is null;

      procesarLinea(lvar_linea, lvar_ctrabajador, lvar_computerid, lvar_loginid, ldat_fecha, lvar_rpta);
      if lvar_rpta <> '00' then
        rollback;
        aclo_rpta := lvar_rpta;
        return;
      end if;
      lnum_grabadas := lnum_grabadas + 1;
      lnum_i := lnum_i + 1;
      ldat_fecha := sysdate;
    end loop;

    commit;
    dvpkg_spt17.listar(lvar_accion || lvar_sepRegistro || to_char(lnum_bloqueDef), aclo_rpta);
  exception
    when dup_val_on_index then
      rollback;
      aclo_rpta := 'E|Ese trabajador ya tiene asignado ese concepto~' || sqlcode || '|' || sqlerrm;
    when others then
      rollback;
      aclo_rpta := 'E|La operación no se pudo realizar~' || sqlcode || '|' || sqlerrm;
  end;

  -- ===================================================== reapuntar =========

  /* Cuando DVPKG_SPT16 modifica un concepto, su fila se cierra y nace otra con
     id nuevo. Las líneas de T17 tienen que seguirlo o quedarían apuntando a
     una versión cerrada. Es un UPDATE y no un versionado: el concepto que el
     trabajador tiene asignado no cambió, cambió cómo se llama la fila que lo
     describe. Versionar 4 400 líneas por corregir una descripción sería
     inventar historia que nunca ocurrió. */
  procedure reapuntar(anum_idviejo in number, anum_idnuevo in number, anum_filas out number) as
  begin
    update dvsahet17_conceptoxtrabajador
       set t17_t16_id = anum_idnuevo
     where t17_cestadoregistro = 'A'
       and t17_t16_id = anum_idviejo;
    anum_filas := sql%rowcount;
  end;

end dvpkg_spt17;
/

show errors package dvpkg_fnt17
show errors package body dvpkg_fnt17
show errors package dvpkg_spt17
show errors package body dvpkg_spt17

select object_name, object_type, status from user_objects
 where object_name in ('DVPKG_SPT17','DVPKG_FNT17') order by 1, 2;
exit
