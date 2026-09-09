using System;
using System.Configuration;
using System.IO;

namespace General.Librerias.CodigoUsuario
{
    public class Log
    {
        public static void Grabar(Exception ex, string keyLog)
        {
            string rutaLog = ConfigurationManager.AppSettings[keyLog];
            DateTime fechaActual = DateTime.Now;
            string nombre = String.Format("Log_{0}_{1}_{2}.txt", fechaActual.Year, fechaActual.Month.ToString().PadLeft(2, '0'), fechaActual.Day.ToString().PadLeft(2, '0'));
            string archivoLog = Path.Combine(rutaLog, nombre);
            beLog obeLog = new beLog();
            obeLog.MensajeError = ex.Message;
            obeLog.DetalleError = ex.StackTrace;
            Objeto.Grabar(obeLog, archivoLog);
        }

        public static void GrabarBD(string error, string keyLog)
        {
            string[] listaError = error.Split('˧');
            int nListaError = listaError.Length;
            beLog obeLog = new beLog();
            if (nListaError > 0)
            {
                string[] listaDetError = listaError[2].Split('|');
                obeLog.StoreProcedure = listaError[0];
                obeLog.TramaEnviada = listaError[1];
                obeLog.MensajeError = listaDetError[0];
                obeLog.DetalleError = listaDetError[1];
            }
            string rutaLog = ConfigurationManager.AppSettings[keyLog];
            DateTime fechaActual = DateTime.Now;
            string nombre = String.Format("LogBd_{0}_{1}_{2}.txt", fechaActual.Year, fechaActual.Month.ToString().PadLeft(2, '0'), fechaActual.Day.ToString().PadLeft(2, '0'));
            string archivoLog = Path.Combine(rutaLog, nombre);
            Objeto.Grabar(obeLog, archivoLog);
        }

        public static void GrabarTrama(string trama, string keyLog)
        {
            string rutaLog = ConfigurationManager.AppSettings[keyLog];
            DateTime fechaActual = DateTime.Now;
            string nombre = String.Format("LogBd_{0}_{1}_{2}.txt", fechaActual.Year, fechaActual.Month.ToString().PadLeft(2, '0'), fechaActual.Day.ToString().PadLeft(2, '0'));
            string archivoLog = Path.Combine(rutaLog, nombre);
            beLog obeLog = new beLog();
            string[] data = trama.Split('-');
            obeLog.StoreProcedure = data[0];
            obeLog.TramaEnviada = data[1];
            Objeto.Grabar(obeLog, archivoLog);
        }
    }
}
