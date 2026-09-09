using System;
using System.IO;
using System.IO.Compression;
using System.Text;

namespace General.Librerias.CodigoUsuario
{
    public class Compresion
    {
        public static byte[] ComprimirZip(string data, string keyRuta)
        {
            byte[] rpta = null;
            try
            {
                byte[] buffer = Encoding.Default.GetBytes(data);
                using (MemoryStream msEntrada = new MemoryStream(buffer))
                {
                    using (MemoryStream msSalida = new MemoryStream())
                    {
                        using (GZipStream gzip = new GZipStream(msSalida, CompressionMode.Compress))
                        {
                            msEntrada.CopyTo(gzip);
                            rpta = msSalida.ToArray();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, keyRuta);
                rpta = Encoding.Default.GetBytes("Error - No se pudo comprimir con Gzip");
            }
            return rpta;
        }

        public static string DescomprimirZip(string data, string keyRuta)
        {
            string rpta = "";
            try
            {
                byte[] buffer = Encoding.Default.GetBytes(data);
                using (MemoryStream msEntrada = new MemoryStream(buffer))
                {
                    using (MemoryStream msSalida = new MemoryStream())
                    {
                        using (GZipStream gzip = new GZipStream(msEntrada, CompressionMode.Decompress))
                        {
                            gzip.CopyTo(msSalida);
                            buffer = msSalida.ToArray();
                            rpta = Encoding.Default.GetString(buffer);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, keyRuta);
                rpta = "Error - No se pudo descomprimir con Gzip";
            }
            return rpta;
        }

        public static byte[] ComprimirDeflate(string data, string keyRuta)
        {
            byte[] rpta = null;
            try
            {
                byte[] buffer = Encoding.Default.GetBytes(data);
                try
                {
                    using (MemoryStream memoryStream = new MemoryStream())
                    {
                        using (DeflateStream deflateStream = new DeflateStream(memoryStream, CompressionMode.Compress))
                        {
                            deflateStream.Write(buffer, 0, data.Length);
                        }
                        rpta = memoryStream.ToArray();
                    }
                }
                catch (Exception ex)
                {
                    Log.Grabar(ex, keyRuta);
                    rpta = Encoding.Default.GetBytes("Error - No se pudo comprimir con Deflate");
                }
                return rpta;
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, keyRuta);
                rpta = Encoding.Default.GetBytes("Error - No se pudo comprimir con Deflate");
            }
            return rpta;
        }

        public static byte[] DescomprimirDeflate(byte[] buffer, string keyRuta)
        {
            byte[] rpta = null;
            try
            {
                using (MemoryStream msEntrada = new MemoryStream(buffer))
                {
                    using (MemoryStream msSalida = new MemoryStream())
                    {
                        using (DeflateStream plain = new DeflateStream(msEntrada, CompressionMode.Decompress))
                        {
                            plain.CopyTo(msSalida);
                            rpta = msSalida.ToArray();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, keyRuta);
                rpta = Encoding.Default.GetBytes("Error - No se pudo descomprimir con Deflate");
            }
            return rpta;
        }

        public static byte[] ComprimirDeflateBytes(byte[] buffer, string keyRuta)
        {
            byte[] rpta = null;
            try
            {
                using (MemoryStream msEntrada = new MemoryStream(buffer))
                {
                    using (MemoryStream msSalida = new MemoryStream())
                    {
                        using (DeflateStream plain = new DeflateStream(msSalida, CompressionMode.Compress))
                        {
                            msEntrada.CopyTo(plain);
                            rpta = msSalida.ToArray();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Grabar(ex, keyRuta);
                rpta = Encoding.Default.GetBytes("Error - No se pudo comprimir con Deflate");
            }
            return rpta;
        }
    }
}
