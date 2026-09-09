using System;
using System.Net;
using System.Net.Http;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace General.Librerias.CodigoUsuario
{
    public class HttpCliente
    {
        public static async Task<string> GetString(string url)
        {
            string data = "";
            HttpClient cliente = new HttpClient();
            Uri direccion = new Uri(url);
            if (direccion.Scheme.Equals("https")) ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;
            HttpResponseMessage rpta = await cliente.GetAsync(url);
            if (rpta != null && rpta.StatusCode == HttpStatusCode.OK)
            {
                data = await rpta.Content.ReadAsStringAsync();
            }
            return data;
        }

        public static async Task<Stream> GetStream(string url)
        {
            Stream data = null;
            HttpClient cliente = new HttpClient();
            HttpResponseMessage rpta = await cliente.GetAsync(url);
            if (rpta != null && rpta.StatusCode == HttpStatusCode.OK)
            {
                data = await rpta.Content.ReadAsStreamAsync();
            }
            return data;
        }

        public static async Task<string> PostString(string url, string data)
        {
            HttpClient cliente = new HttpClient();
            StringContent contenido = new StringContent(data, Encoding.UTF8, "application/json");            
            HttpResponseMessage rpta = await cliente.PostAsync(url, contenido);
            if (rpta != null && rpta.StatusCode == HttpStatusCode.OK)
            {
                data = await rpta.Content.ReadAsStringAsync();
            }
            return data;
        }

        public static async Task<string> PutString(string url, string data)
        {
            HttpClient cliente = new HttpClient();
            StringContent contenido = new StringContent(data, Encoding.UTF8, "application/json");
            HttpResponseMessage rpta = await cliente.PutAsync(url, contenido);
            if (rpta != null && rpta.StatusCode == HttpStatusCode.OK)
            {
                data = await rpta.Content.ReadAsStringAsync();
            }
            return data;
        }

        public static async Task<string> DeleteString(string url)
        {
            string data = "";
            HttpClient cliente = new HttpClient();
            HttpResponseMessage rpta = await cliente.DeleteAsync(url);
            if (rpta != null && rpta.StatusCode == HttpStatusCode.OK)
            {
                data = await rpta.Content.ReadAsStringAsync();
            }
            return data;
        }

        public static async Task<string> PostFormString(string url, string data)
        {
            string salida = "";
            HttpClient cliente = new HttpClient();
            MultipartFormDataContent formulario = new MultipartFormDataContent();
            formulario.Add(new StringContent(data), "Data");
            HttpResponseMessage rpta = await cliente.PostAsync(url, formulario);
            if (rpta != null && rpta.StatusCode == HttpStatusCode.OK)
            {
                salida = await rpta.Content.ReadAsStringAsync();
            }
            return salida;
        }

        public static async Task<string> PostBytes(string url, byte[] data)
        {
            string salida = "";
            HttpClient cliente = new HttpClient();
            MemoryStream ms = new MemoryStream(data);
            StreamContent stream= new StreamContent(ms);
            HttpResponseMessage rpta = await cliente.PostAsync(url, stream);
            if (rpta != null && rpta.StatusCode == HttpStatusCode.OK)
            {
                salida = await rpta.Content.ReadAsStringAsync();
            }
            return salida;
        }
    }
}
