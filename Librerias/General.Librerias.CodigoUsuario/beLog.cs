using System;

namespace General.Librerias.CodigoUsuario
{
    public class beLog
    {
        public DateTime FechaHora { get; set; }
        public string StoreProcedure { get; set; }
        public string TramaEnviada { get; set; }
        public string MensajeError { get; set; }
        public string DetalleError { get; set; }
        public int LineNumberError { get; set; }

        public beLog()
        {
            FechaHora = DateTime.Now;
        }
    }
}
