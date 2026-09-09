using General.Librerias.AccesoDatosOracle;
using General.Librerias.CodigoUsuario;
using System;
using io = System.IO;
using System.Collections.Generic;
using System.Configuration;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Linq;
using SAHE.Filtros;
using System.Web.WebPages;
using System.IO;
using System.Data;
using System.Text;

namespace SAHE.Controllers
{
    public class SAHEController : Controller
    {
        public ActionResult Login()
        {
            ViewBag.Token = Guid.NewGuid().ToString() + "-" + DateTime.Now.ToString("HHmmss");
            ViewBag.VersionJs = ConfigurationManager.AppSettings["vJs"];
            ViewBag.VersionCss = ConfigurationManager.AppSettings["vCss"];
            return View();
        }

        [FiltroAutenticacion]
        public ActionResult Escritorio()
        {
            ViewBag.VersionJs = ConfigurationManager.AppSettings["vJs"];
            ViewBag.VersionCss = ConfigurationManager.AppSettings["vCss"];
            return View();
        }

        public ActionResult Error(string codigo)
        {
            ViewBag.VersionJs = ConfigurationManager.AppSettings["vJs"];
            ViewBag.VersionCss = ConfigurationManager.AppSettings["vCss"];
            int lInt_estado;

            if (!Int32.TryParse(codigo, out lInt_estado))
                lInt_estado = Response.StatusCode >= 400 ? Response.StatusCode : 500;
            if (lInt_estado < 400 || lInt_estado > 599) lInt_estado = 500;

            Response.StatusCode = lInt_estado;
            Response.TrySkipIisCustomErrors = true;
            ViewBag.Codigo = lInt_estado.ToString();
            string lStr_origen = Request.QueryString["aspxerrorpath"];

            if (String.IsNullOrEmpty(lStr_origen)) lStr_origen = Request.QueryString["origen"];

            ViewBag.Origen = lStr_origen ?? "";
            ViewBag.Referencia = DateTime.Now.ToString("yyyyMMdd-HHmmss");
            ViewBag.Usuario = Session["ssUsuarioLogin"] == null ? "" : Session["ssUsuarioLogin"].ToString();
            return View();
        }

        [FiltroAutenticacion]
        public ActionResult Sistema(string data)
        {
            if (!string.IsNullOrEmpty(data) && data.Contains("¦") && data.Length > 1)
            {
                String[] lArr_datos = data.Split('¦');
                String lStr_tabla = lArr_datos[0];
                ViewBag.Tabla = data;
                ViewBag.VersionJs = ConfigurationManager.AppSettings["vJs"];
                ViewBag.VersionCss = ConfigurationManager.AppSettings["vCss"];
                String lStr_popup = Server.MapPath(CARPETA_CONTROLES + lStr_tabla + ".txt");
                if (io.File.Exists(lStr_popup)) ViewBag.Controles = io.File.ReadAllText(lStr_popup);
            }
            else
            {
                ViewBag.Error = "No se puede ingresar al sistema";
                return View("Error");
            }
            return View();
        }

        public async Task<string> validarLogin()
        {
            string lStr_rpta = "";
            string lStr_token = Request.Headers["token"];
            string lStr_data = Request.Form["data"];
            try
            {
                if (!String.IsNullOrEmpty(lStr_token) && !String.IsNullOrEmpty(lStr_data))
                {
                    lStr_rpta = await ClavesHost(lStr_data);
                    string[] lArr_aDataClaveHost = lStr_rpta.Split('~');
                    if (lStr_rpta.Split('|')[0] != "00") return lStr_rpta;
                    if (lArr_aDataClaveHost[0].Split('|')[0] == "00" && !lArr_aDataClaveHost[1].Contains("Error") && !lArr_aDataClaveHost[1].StartsWith("E|"))
                    {
                        string[] lArr_infoUsuario = lArr_aDataClaveHost[1].Split('|');
                        string lStr_cUsuario = lArr_infoUsuario[0];
                        string lStr_cOficina = lArr_infoUsuario[2];
                        Session["ssUsuarioLogin"] = lStr_cUsuario;
                    }
                    else lStr_rpta = lArr_aDataClaveHost[1];
                }
                else
                {
                    lStr_rpta = "E|Datos de autenticación incompletos.";
                    return lStr_rpta;
                }
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, "ArchivoLog");
                lStr_rpta = "E|Error del sistema.";
            }
            return lStr_rpta;
        }

        private async Task<string> ClavesHost(string data)
        {
            string lStr_rpta = "", lStr_datosTrabajador = "", lStr_resultado = "";
            ws_ClaveHost.AutenticaRegService lWs_ClavesHost = new ws_ClaveHost.AutenticaRegService();
            string lStr_datoSistema = ConfigurationManager.AppSettings["ClaveHostSistema"];
            string[] lArr_datoSistema = lStr_datoSistema.Split('|');
            int lInt_totalDatoSistema = lArr_datoSistema.Length;
            lWs_ClavesHost.Url = ConfigurationManager.AppSettings["UrlClaveHost"];
            string[] lStr_aCampos = data.Split('|');
            string lStr_usuario = lStr_aCampos[0];
            string lStr_clave = lStr_aCampos[1];
            /*
            try
            {
                lStr_resultado = lWs_ClavesHost.claveHost(lStr_usuario + lStr_clave + lStr_datoSistema.Split('|')[0]);
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, "ArchivoLog");
                return "20|Clave Host: " + ex.Message;
            }
            */
            string lStr_dTrabajador = await buscarTrabajador(lStr_usuario);
            if (!String.IsNullOrWhiteSpace(lStr_dTrabajador))
            {
                string[] lArr_camposTrabajador = lStr_dTrabajador.Split('|');
                string lStr_perfil = "";
                string[] lArr_perfil;

                if (lArr_camposTrabajador.Length < 4)
                    return "E|El usuario no tiene un perfil asignado en el aplicativo.";

                if (lArr_camposTrabajador[3].Equals("AD"))
                {
                    lStr_perfil = ConfigurationManager.AppSettings["pAdministrador"];
                }
                else if (lArr_camposTrabajador[3].Equals("FO"))
                {
                    lStr_perfil = ConfigurationManager.AppSettings["pFuncionarioOP"];
                }
                else if (lArr_camposTrabajador[3].Equals("FR"))
                {
                    lStr_perfil = ConfigurationManager.AppSettings["pFuncionarioRA"];
                }
                else if (lArr_camposTrabajador[3].Equals("JP"))
                {
                    lStr_perfil = ConfigurationManager.AppSettings["pJefeOP"];
                }
                else if (lArr_camposTrabajador[3].Equals("JR"))
                {
                    lStr_perfil = ConfigurationManager.AppSettings["pJefeRA"];
                }
                else if (lArr_camposTrabajador[3].Equals("TR"))
                {
                    lStr_perfil = ConfigurationManager.AppSettings["pTrabajador"];
                }
                else if (lArr_camposTrabajador[3].Equals("SV"))
                {
                    lStr_perfil = ConfigurationManager.AppSettings["pSupervisor"];
                }
                
                if (String.IsNullOrEmpty(lStr_perfil))
                    return "E|El perfil '" + lArr_camposTrabajador[3] + "' no está configurado en el aplicativo.";

                lArr_perfil = lStr_perfil.Split('|');
                if (lArr_perfil.Length < lInt_totalDatoSistema)
                    return "E|El perfil '" + lArr_camposTrabajador[3] + "' tiene " + lArr_perfil.Length +
                           " juego(s) de opciones y se esperan " + lInt_totalDatoSistema + ".";

                for (int i = 0; i < lInt_totalDatoSistema; i++)
                {
                    lStr_resultado += "00||0|" + lArr_camposTrabajador[1] + "|" + lArr_perfil[i] + "|||Su acceso ha sido exitoso|||||";
                    if (i < lInt_totalDatoSistema - 1) lStr_resultado += "~";
                }
            }
            
            if (String.IsNullOrEmpty(lStr_resultado))
                return "E|El usuario no está registrado en el aplicativo.";

            string[] lArr_listaResultados = lStr_resultado.Split('~');
            string lStr_cTrabajador = "", lStr_Status = "", lStr_menuPerfil = "";
            string[] lStr_campos;
            string[] lArr_opciones = new string[lInt_totalDatoSistema];
            int lInt_totalListaResutlados = lArr_listaResultados.Length;
            for (int i = 0; i < lInt_totalListaResutlados; i++)
            {
                lStr_campos = lArr_listaResultados[i].Split('|');
                lStr_Status = lStr_campos.Length > 0 ? lStr_campos[0] : "";
                if (lStr_Status == "00" && lStr_campos.Length > 7)
                {
                    lStr_Status = lStr_Status + "|" + lStr_campos[7];
                    lStr_cTrabajador = lStr_campos[3];
                    if (i < lArr_opciones.Length) lArr_opciones[i] = lStr_campos[4];
                }
                else
                {
                    lStr_rpta = lStr_Status + "|" + (lStr_campos.Length > 1 ? lStr_campos[1] : "Respuesta no reconocida del Sistema de Claves Host.");
                    return lStr_rpta;
                }
            }
            lStr_menuPerfil = await getPerfiles(lArr_opciones, lArr_datoSistema);
            daSql odaSql = new daSql("conSAI", "ArchivoLog");
            lStr_datosTrabajador = odaSql.EjecutarComandoOracle("bnpkgd_sahe.obtenerdatosusuario", "aVar_datos", lStr_cTrabajador, false);
            if (!string.IsNullOrEmpty(lStr_datosTrabajador))
            {
                string[] dataError = lStr_datosTrabajador.Split('|');
                if (dataError[0].Contains("Error")) return lStr_datosTrabajador;
                else
                {
                    lStr_rpta = lStr_Status + "~" + lStr_datosTrabajador + "~" + lStr_menuPerfil;
                }
            }
            return lStr_rpta;
        }

        private async Task<string> buscarTrabajador(string aStr_usuario)
        {
            string lStr_rpta = "";
            List<string> lLst_listaUsuarios = new List<string>();
            string lStr_archivo = Server.MapPath(ARCHIVO_USUARIOS);
            if (io.File.Exists(lStr_archivo))
            {
                await Task.Run(() => {
                    lLst_listaUsuarios = io.File.ReadAllLines(lStr_archivo).ToList();
                });
            }
            foreach (string usuario in lLst_listaUsuarios)
            {
                if (usuario.StartsWith(aStr_usuario, StringComparison.OrdinalIgnoreCase))
                {
                    lStr_rpta = usuario;
                    break;
                }
            }
            return lStr_rpta;
        }

        private async Task<string> getPerfiles(string[] aStr_opciones, string[] aArr_sistema)
        {
            int lInt_totalDatoSistema = aArr_sistema.Length;
            string lStr_rutaArchivo = Server.MapPath(ARCHIVO_MENU);
            List<string> lLst_listaMenus = new List<string>();
            if (io.File.Exists(lStr_rutaArchivo))
            {
                await Task.Run(() =>
                {
                    lLst_listaMenus = io.File.ReadAllLines(lStr_rutaArchivo).ToList();
                });
            }

            var codigosPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            int lInt_totalOpciones = Math.Min(lInt_totalDatoSistema, aStr_opciones.Length);
            for (int j = 0; j < lInt_totalOpciones; j++)
            {
                string lStr_opcionesSistema = aStr_opciones[j] ?? "";
                for (int i = 0; i + 3 <= lStr_opcionesSistema.Length; i += 3)
                {
                    char lChr_permiso = lStr_opcionesSistema[i + 2];
                    if (lChr_permiso == 'S' || lChr_permiso == 's')
                        codigosPermitidos.Add(lStr_opcionesSistema.Substring(i, 2) + aArr_sistema[j]);
                }
            }

            var resultado = new List<string>();
            var padresConCRUD = new Dictionary<string, string>();
            var gruposConHijos = new HashSet<string>();

            foreach (string opcion in lLst_listaMenus)
            {
                string[] partes = opcion.Split('|');
                if (partes.Length < 6) continue;

                string id = partes[0].Trim();
                string operacion = partes[3];
                string tipo = partes[4];
                string padre = partes[5];

                if (!codigosPermitidos.Contains(id)) continue;

                if (tipo == "MP" || tipo == "SM")
                {
                    resultado.Add(opcion);
                    if (tipo == "SM" && !string.IsNullOrEmpty(padre)) gruposConHijos.Add(padre);
                }
                else if (tipo == "A" && !string.IsNullOrEmpty(padre) && !string.IsNullOrEmpty(operacion))
                {
                    if (padresConCRUD.ContainsKey(padre))
                    {
                        if (padresConCRUD[padre].IndexOf(operacion + "¦", StringComparison.Ordinal) < 0)
                            padresConCRUD[padre] += operacion + "¦";
                    }
                    else padresConCRUD[padre] = operacion + "¦";
                }
            }

            resultado.RemoveAll(linea =>
            {
                string[] campos = linea.Split('|');
                return campos.Length >= 5 && campos[4] == "MP" && !gruposConHijos.Contains(campos[0].Trim());
            });

            return string.Join("¬", resultado.Select(linea =>
            {
                string[] campos = linea.Split('|');
                string acciones;
                if (campos.Length >= 5 && campos[4] == "SM" &&
                    padresConCRUD.TryGetValue(campos[0].Trim(), out acciones) &&
                    !string.IsNullOrEmpty(campos[3]))
                {
                    campos[3] += acciones;
                    return string.Join("|", campos);
                }
                return linea;
            }));
        }

        public ActionResult Logout()
        {
            cerrarSesion();
            return RedirectToAction("Login", "SAHE");
        }

        private void cerrarSesion()
        {
            try
            {
                Session.Clear();
                Session.Abandon();
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, "ArchivoLog");
            }

            if (Request.Cookies["ASP.NET_SessionId"] != null)
            {
                HttpCookie lObj_cookie = new HttpCookie("ASP.NET_SessionId", "");
                lObj_cookie.Expires = DateTime.Now.AddDays(-1);
                lObj_cookie.HttpOnly = true;
                lObj_cookie.Path = String.IsNullOrEmpty(Request.ApplicationPath) ? "/" : Request.ApplicationPath;
                Response.Cookies.Add(lObj_cookie);
            }

            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetNoStore();
            Response.Cache.SetExpires(DateTime.UtcNow.AddDays(-1));
        }

        [FiltroUrl]
        public void Cargar(string data)
        {
            if (string.IsNullOrWhiteSpace(data) && !data.Contains("|") && data.Length < 2)
            {
                Response.Clear();
                Response.StatusCode = 400;
                Response.Write("E|No se recibieron datos para procesar");
                Response.End();
                return;
            }
            /* 'tabla|resto'. El resto viaja ENTERO al paquete: puede ser la
               accion sola -'C'-, la accion con el tamano del bloque -'C¬200'-
               o la accion con lo que la pantalla necesite mandar, como el
               trabajador y la ubicacion con que entra T01FUN -'C|0277592|7800'-.
               Antes se tomaba solo el segundo trozo del Split, asi que de esa
               ultima forma al paquete le llegaba una 'C' pelada y el resto se
               perdia sin que nadie avisara. */
            int lInt_corte = data.IndexOf('|');
            string lStr_tabla = lInt_corte < 0 ? data : data.Substring(0, lInt_corte);
            string lStr_dato = lInt_corte < 0 ? "C" : data.Substring(lInt_corte + 1);
            if (string.IsNullOrEmpty(lStr_dato)) lStr_dato = "C";
            daSql odaSql = new daSql("conSAHE", "ArchivoLog");
            string lStr_rpta = "";
            if (!string.IsNullOrEmpty(lStr_dato)) Log.GrabarTrama("dvpkg_sp" + lStr_tabla + ".cargar" + " - " + lStr_dato, "ArchivoLog");
            else Log.GrabarTrama("dvpkg_sp" + lStr_tabla + ".cargar", "ArchivoLog");
            lStr_rpta = odaSql.EjecutarComandoOracle("bn_sahe.dvpkg_sp" + lStr_tabla + ".cargar", "avar_datos", lStr_dato, false);
            if (!string.IsNullOrEmpty(lStr_rpta))
            {
                byte[] bufferComprimido = Compresion.ComprimirDeflate(lStr_rpta, "ArchivoLog");
                Response.Clear();
                Response.WriteBinary(bufferComprimido);
                Response.End();
            }
        }

        [FiltroUrl]
        public async Task gestionar()
        {
            string lStr_rpta = "";
            string data = Request.Form["data"];
            string dataDetalle = Request.Form["dataDetalle"];
            string[] datos = data.Split('¬');
            string lStr_tabla = datos[0];
            string lStr_loginId = "dvalenzuela"; //Request.ServerVariables["REMOTE_USER"].ToString();
            string lStr_computerId = HttpContext.Request.UserHostAddress;
            data = ConAuditoria(datos, lStr_computerId, lStr_loginId);
            if (!string.IsNullOrEmpty(dataDetalle)) data += '¯' + dataDetalle;
            int cantidadFiles = Request.Files.Count;
            if (cantidadFiles > 0)
            {
                lStr_rpta = await SubirArchivo(cantidadFiles);
                if (!string.IsNullOrEmpty(lStr_rpta))
                {
                    responder(lStr_rpta);
                    return;
                }
            }
            daSql odaSql = new daSql("conSAHE", "ArchivoLog");
            Log.GrabarTrama("dvpkg_sp" + lStr_tabla + ".gestionar" + " - " + data, "ArchivoLog");
            lStr_rpta = await odaSql.EjecutarComandoOracleAsync("bn_sahe.dvpkg_sp" + lStr_tabla + ".gestionar", "aVar_datos", data);
            /* Que una consulta no devuelva nada NO es una falla: es que no hay
               registros con esos filtros, y la pantalla tiene que poder vaciar
               la grilla. Grabar o eliminar sin respuesta si es una falla: esas
               operaciones siempre contestan algo. */
            if (string.IsNullOrEmpty(lStr_rpta) && !EsConsulta(data))
            {
                lStr_rpta = "E|El servidor no devolvió respuesta de la operación.";
            }
            responder(lStr_rpta);
        }

        /* La consulta no es una operacion sobre un registro: no crea, no
           modifica y no da de baja nada, asi que no lleva auditoria. Si se le
           pegara el equipo y el usuario, el paquete recibiria dos campos de
           mas detras de los filtros y tendria que saltearlos para leer lo
           unico que le importa, que es con que se consulta. */
        static bool EsConsulta(string trama)
        {
            return !string.IsNullOrEmpty(trama) && (trama == "C" || trama.StartsWith("C|"));
        }

        /* El cuerpo de la trama con el equipo y el usuario pegados a CADA
           registro.

           Se recorren TODOS los segmentos y no solo el primero porque la baja
           multiple manda uno por fila -'T01¬D|1|0347159¬D|3|0347159'-: con
           datos[1] a secas, del segundo registro en adelante no llegaba nada
           al paquete y solo se borraba el primero. */
        static string ConAuditoria(string[] datos, string computerId, string loginId)
        {
            StringBuilder cuerpo = new StringBuilder();
            for (int i = 1; i < datos.Length; i++)
            {
                if (i > 1) cuerpo.Append('¬');
                cuerpo.Append(datos[i]);
                if (!EsConsulta(datos[i]))
                {
                    cuerpo.Append("|").Append(computerId).Append("|").Append(loginId);
                }
            }
            return cuerpo.ToString();
        }

        [FiltroUrl]
        public async Task Obtener(string tabla, string data)
        {
            string lStr_rpta = "";
            daSql odaSql = new daSql("conSAHE", "ArchivoLog");
            Log.GrabarTrama("dvpkg_sp" + tabla + ".obtener" + " - " + data, "ArchivoLog");
            lStr_rpta = await odaSql.EjecutarComandoOracleAsync("bn_sahe.dvpkg_sp" + tabla + ".obtener", "aVar_datos", data);
            if (!string.IsNullOrEmpty(lStr_rpta))
            {
                byte[] bufferComprimido = Compresion.ComprimirDeflate(lStr_rpta, "ArchivoLog");
                Response.Clear();
                Response.WriteBinary(bufferComprimido);
                Response.End();
            }
        }

        /* Devuelve el documento adjunto de un registro. La grilla manda el
           NOMBRE -que es lo unico que guarda la trama- y aqui se busca en la
           misma carpeta donde lo dejo SubirArchivo.

           No se acepta cualquier nombre: se descarta la ruta que venga, se
           exige la extension permitida y se comprueba que el archivo resuelto
           siga dentro de la carpeta. Sin eso, un 'archivo' con ..\..\web.config
           serviria cualquier fichero del servidor. */
        [FiltroUrl]
        public FileResult Adjunto()
        {
            string lStr_pedido = Request.Form["archivo"];
            if (string.IsNullOrWhiteSpace(lStr_pedido)) return null;

            string lStr_nombre = Path.GetFileName(lStr_pedido);
            if (string.IsNullOrWhiteSpace(lStr_nombre)) return null;

            string lStr_extension = Path.GetExtension(lStr_nombre).ToLowerInvariant();
            if (Array.IndexOf(EXTENSIONES_PERMITIDAS, lStr_extension) < 0) return null;

            string lStr_carpeta = Server.MapPath(CARPETA_DOCUMENTOS);
            string lStr_ruta = Path.GetFullPath(Path.Combine(lStr_carpeta, lStr_nombre));
            if (!lStr_ruta.StartsWith(lStr_carpeta, StringComparison.OrdinalIgnoreCase)) return null;
            if (!io.File.Exists(lStr_ruta)) return null;

            return File(io.File.ReadAllBytes(lStr_ruta), getMime(lStr_nombre), lStr_nombre);
        }

        [FiltroUrl]
        public FileResult Exportar()
        {
            FileResult rpta = null;
            string archivo = Request.Form["archivo"];
            string nombre = Path.GetFileNameWithoutExtension(archivo);
            string extension = Path.GetExtension(archivo).ToLower();
            string data = Request.Form["data"];
            if (!string.IsNullOrEmpty(data))
            {
                byte[] buffer = null;
                DataTable tabla = Cadena.ConvertirTabla(data);
                DataSet dst = new DataSet();
                dst.Tables.Add(tabla);
                if (tabla != null && tabla.Rows.Count > 0)
                {
                    switch (extension)
                    {
                        case ".xlsx":
                            ExcelMemory objExcel = new ExcelMemory();
                            buffer = objExcel.Exportar(new string[] { nombre }, dst);
                            break;
                    }
                    if (buffer != null && buffer.Length > 0)
                    {
                        rpta = File(buffer, getMime(archivo));
                    }
                }
            }
            return rpta;
        }


        private string getMime(string archivo)
        {
            string mime = "";
            string[] campos = archivo.Split('.');
            string extension = campos[campos.Length - 1].ToLower();
            switch (extension)
            {
                case "txt":
                    mime = "text/plain";
                    break;
                case "csv":
                    mime = "text/csv";
                    break;
                case "json":
                    mime = "application/json";
                    break;
                case "xlsx":
                    mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    break;
                case "docx":
                    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    break;
                case "pdf":
                    mime = "application/pdf";
                    break;
                default:
                    mime = "application/octet-stream";
                    break;
            }
            return mime;
        }

        private void responder(string aStr_rpta)
        {
            byte[] bufferComprimido = Compresion.ComprimirDeflate(aStr_rpta, "ArchivoLog");
            Response.Clear();
            Response.WriteBinary(bufferComprimido);
            Response.End();
        }

        /* Todo lo que la aplicacion lee o escribe en disco vive bajo App_Data.
           No es una preferencia de orden: ASP.NET bloquea esa carpeta, asi que
           IIS no la sirve como contenido estatico. Mientras estuvieron colgando
           de la raiz del sitio, bastaba con saber la URL para bajarse
           /Archivos/Usuarios.txt -codigos, nombres y perfiles de todo el
           personal-, la definicion de cada pantalla con el orden exacto de la
           trama que espera Oracle, y cualquier documento adjunto sin pasar por
           la sesion. */
        private const string CARPETA_CONTROLES = "~/App_Data/Archivos/Controles/";
        private const string ARCHIVO_USUARIOS = "~/App_Data/Archivos/Usuarios.txt";
        private const string ARCHIVO_MENU = "~/App_Data/Archivos/Menu/Menu.txt";
        private const string CARPETA_DOCUMENTOS = "~/App_Data/Documentos/";

        private static readonly string[] EXTENSIONES_PERMITIDAS = { ".pdf" };
        private const int TAMANIO_MAXIMO_ARCHIVO = 10 * 1024 * 1024;

        private async Task<string> SubirArchivo(int cantidadFiles)
        {
            string lStr_carpeta = Server.MapPath(CARPETA_DOCUMENTOS);
            List<string> lLst_escritos = new List<string>();

            try
            {
                if (!Directory.Exists(lStr_carpeta)) Directory.CreateDirectory(lStr_carpeta);

                for (int i = 0; i < cantidadFiles; i++)
                {
                    HttpPostedFileBase lObj_archivo = Request.Files[i];

                    if (lObj_archivo == null || lObj_archivo.InputStream == null || lObj_archivo.ContentLength == 0)
                        return "E|El documento llegó vacío. Vuelva a seleccionarlo.";

                    if (lObj_archivo.ContentLength > TAMANIO_MAXIMO_ARCHIVO)
                        return "E|El documento supera el tamaño máximo de 10 MB.";

                    string lStr_nombre = Path.GetFileName(lObj_archivo.FileName);
                    if (string.IsNullOrWhiteSpace(lStr_nombre))
                        return "E|El documento no tiene nombre.";

                    string lStr_extension = Path.GetExtension(lStr_nombre).ToLowerInvariant();
                    if (Array.IndexOf(EXTENSIONES_PERMITIDAS, lStr_extension) < 0)
                        return "E|Solo se admiten documentos en formato PDF.";

                    string lStr_destino = Path.GetFullPath(Path.Combine(lStr_carpeta, lStr_nombre));
                    if (!lStr_destino.StartsWith(lStr_carpeta, StringComparison.OrdinalIgnoreCase))
                        return "E|El nombre del documento no es válido.";

                    string lStr_temporal = lStr_destino + ".subiendo";
                    using (FileStream lObj_flujo = new FileStream(lStr_temporal, FileMode.Create, FileAccess.Write, FileShare.None))
                    {
                        await lObj_archivo.InputStream.CopyToAsync(lObj_flujo);
                    }

                    if (io.File.Exists(lStr_destino)) io.File.Delete(lStr_destino);
                    io.File.Move(lStr_temporal, lStr_destino);
                    lLst_escritos.Add(lStr_destino);
                }
                return "";
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, "ArchivoLog");
                limpiarParciales(lLst_escritos, lStr_carpeta);
                return "E|No se pudo guardar el documento. Comuníquese con Soporte de Informática.";
            }
        }

        private void limpiarParciales(List<string> aLst_escritos, string aStr_carpeta)
        {
            try
            {
                foreach (string lStr_temporal in Directory.GetFiles(aStr_carpeta, "*.subiendo"))
                {
                    io.File.Delete(lStr_temporal);
                }
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, "ArchivoLog");
            }
        }
    }
}