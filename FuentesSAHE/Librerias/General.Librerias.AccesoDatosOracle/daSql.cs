using System;
using System.Data;
using Oracle.ManagedDataAccess.Client;
using System.Configuration;
using General.Librerias.CodigoUsuario;
using Oracle.ManagedDataAccess.Types;
using System.Threading.Tasks;

namespace General.Librerias.AccesoDatosOracle
{
    public class daSql
    {
        string CadenaConexion = "";
        string sKeyLog = "";

        /* Los errores que Oracle levanta cuando el paquete se recompiló por
           debajo de una sesión que todavía lo tenía cargado:

             ORA-04061  el estado del paquete quedó invalidado
             ORA-04065  no se ejecutó el paquete invalidado
             ORA-04068  se descartó el estado de los paquetes

           No son fallas de los datos ni del programa: el aplicativo trabaja
           con un pool de conexiones, así que la conexión reusada arrastra la
           versión anterior del paquete. Oracle avisa, descarta el estado y NO
           ejecuta nada; la llamada siguiente por esa misma sesión funciona.
           Eso es lo que se veía como "error de base de datos la primera vez y
           bien la segunda" cada vez que se compilaba un paquete. */
        static bool EsPaqueteRecompilado(OracleException ex)
        {
            return ex != null && (ex.Number == 4061 || ex.Number == 4065 || ex.Number == 4068);
        }

        public daSql(string NombreConexion, string keyLog)
        {
            sKeyLog = keyLog;
            try
            {
                ConnectionStringSettings conss = ConfigurationManager.ConnectionStrings[NombreConexion];
                if (conss != null)
                {
                    CadenaConexion = conss.ConnectionString;
                }
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, sKeyLog);
            }
        }

        public string EjecutarComandoOracle(string NombreSP, string parametroNombre = "", string parametroValor = "", bool esCursor = true)
        {
            /* Dos intentos, y el segundo solo por un paquete recién compilado.
               Reintentar es seguro justamente porque en ese caso Oracle no
               llegó a ejecutar el procedimiento: descartó el estado y levantó
               el error antes de entrar. Cualquier otra falla se informa a la
               primera, sin repetir una operación que sí pudo haber corrido. */
            for (int intento = 1; intento <= 2; intento++)
            {
                try
                {
                    return EjecutarUnaVez(NombreSP, parametroNombre, parametroValor, esCursor);
                }
                catch (OracleException oraEx)
                {
                    if (intento == 1 && EsPaqueteRecompilado(oraEx))
                    {
                        /* Las demás conexiones del pool cargan la misma versión
                           vieja: si no se vacía, el siguiente usuario tropieza
                           con lo mismo. */
                        LimpiarPool();
                        continue;
                    }
                    Log.GrabarBD("˧˧" + oraEx.Message + "|" + oraEx.StackTrace, sKeyLog);
                    return "E|Ocurrio un error con la Base de Datos";
                }
                catch (Exception ex)
                {
                    Log.GrabarBD(NombreSP + "˧" + parametroValor + "˧" + ex.Message + "|" + ex.StackTrace, sKeyLog);
                    return "E|Ocurrio un error con la Base de Datos";
                }
            }
            return "E|Ocurrio un error con la Base de Datos";
        }

        /* Una ejecución, sin atrapar nada: quien llama decide si reintenta. */
        string EjecutarUnaVez(string NombreSP, string parametroNombre, string parametroValor, bool esCursor)
        {
            string rpta = "";
            using (OracleConnection con = new OracleConnection(CadenaConexion))
            {
                con.Open();
                OracleCommand cmd = new OracleCommand(NombreSP, con);
                cmd.CommandType = CommandType.StoredProcedure;
                if (!String.IsNullOrEmpty(parametroNombre) && !String.IsNullOrEmpty(parametroValor))
                {
                    cmd.Parameters.Add(parametroNombre, OracleDbType.Clob).Value = parametroValor;
                }
                OracleParameter lPmt_OraPmt = new OracleParameter();
                lPmt_OraPmt.OracleDbType = esCursor ? OracleDbType.RefCursor : OracleDbType.Clob;
                lPmt_OraPmt.Direction = System.Data.ParameterDirection.Output;
                cmd.Parameters.Add(lPmt_OraPmt);
                string data = null;
                if (esCursor)
                {
                    data = cmd.ExecuteScalar().ToString();
                }
                else
                {
                    int rpta2 = cmd.ExecuteNonQuery();
                    OracleClob CLOB = (OracleClob)lPmt_OraPmt.Value;
                    data = !CLOB.IsNull ? CLOB.Value : "";
                }

                if (data != null)
                {
                    string[] listaData = data.ToString().Split('~');
                    int nListaData = listaData.Length;
                    if (nListaData > 0)
                    {
                        if (listaData[0] == "E")
                        {
                            rpta = listaData[0] + "~" + listaData[1];
                            Log.GrabarBD(NombreSP + "˧" + parametroValor + "˧" + listaData[2], sKeyLog);
                            return rpta;
                        }
                        else rpta = data.ToString();
                    }
                    else rpta = data.ToString();
                }
            }
            return rpta;
        }

        public async Task<string> EjecutarComandoOracleAsync(string NombreSP, string parametroNombre = "", string parametroValor = "")
        {
            string rpta = "";
            await Task.Run(() =>
            {
                for (int intento = 1; intento <= 2; intento++)
                {
                    try
                    {
                        rpta = EjecutarUnaVezAsync(NombreSP, parametroNombre, parametroValor);
                        return;
                    }
                    catch (OracleException oraEx)
                    {
                        if (intento == 1 && EsPaqueteRecompilado(oraEx))
                        {
                            LimpiarPool();
                            continue;
                        }
                        Log.GrabarBD("˧˧" + oraEx.Message + "|" + oraEx.StackTrace, sKeyLog);
                        rpta = "E|Ocurrio un error con la Base de Datos";
                        return;
                    }
                    catch (Exception ex)
                    {
                        Log.GrabarBD(NombreSP + "˧" + parametroValor + "˧" + ex.Message + "|" + ex.StackTrace, sKeyLog);
                        rpta = "E|Ocurrio un error con la Base de Datos";
                        return;
                    }
                }
                rpta = "E|Ocurrio un error con la Base de Datos";
            });
            return rpta;
        }

        string EjecutarUnaVezAsync(string NombreSP, string parametroNombre, string parametroValor)
        {
            string rpta = "";
            using (OracleConnection con = new OracleConnection(CadenaConexion))
            {
                con.Open();
                OracleCommand cmd = new OracleCommand(NombreSP, con);
                cmd.CommandType = CommandType.StoredProcedure;
                if (!String.IsNullOrEmpty(parametroNombre) && !String.IsNullOrEmpty(parametroValor))
                {
                    cmd.Parameters.Add(parametroNombre, OracleDbType.Clob).Value = parametroValor;
                }
                OracleParameter lPmt_OraPmt = new OracleParameter();
                lPmt_OraPmt.OracleDbType = OracleDbType.Clob;
                lPmt_OraPmt.Direction = System.Data.ParameterDirection.Output;
                cmd.Parameters.Add(lPmt_OraPmt);
                string data = null;
                int rpta2 = cmd.ExecuteNonQuery();
                OracleClob CLOB = (OracleClob)lPmt_OraPmt.Value;
                data = !CLOB.IsNull ? CLOB.Value : "";

                if (data != null)
                {
                    string[] listaData = data.ToString().Split('~');
                    int nListaData = listaData.Length;
                    if (nListaData > 0)
                    {
                        string[] mensajePersonalizado = listaData[0].Split('|');
                        if (mensajePersonalizado[0] == "E")
                        {
                            rpta = listaData[0];
                            Log.GrabarBD(NombreSP + "˧" + parametroValor + "˧" + listaData[1], sKeyLog);
                        }
                        else rpta = data.ToString();
                    }
                    else rpta = data.ToString();
                }
            }
            return rpta;
        }

        /* Vacía el pool de esta cadena de conexión. Se abre una conexión sin
           usarla porque ClearPool trabaja sobre una instancia; no se llama a
           ClearAllPools para no arrastrar los pools de otras bases. */
        void LimpiarPool()
        {
            try
            {
                using (OracleConnection con = new OracleConnection(CadenaConexion))
                {
                    OracleConnection.ClearPool(con);
                }
            }
            catch (Exception ex)
            {
                /* Si no se puede limpiar, el reintento igual vale la pena: la
                   sesión que levantó el error ya descartó su estado. */
                Log.GrabarBD("˧˧No se pudo vaciar el pool de conexiones|" + ex.Message, sKeyLog);
            }
        }
    }
}
