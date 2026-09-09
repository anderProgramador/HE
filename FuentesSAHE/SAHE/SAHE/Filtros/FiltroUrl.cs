using System.Net;
using System.Web;
using System.Web.Mvc;

namespace SAHE.Filtros
{
    /// <summary>
    /// Protege las acciones que mueven datos (Cargar, gestionar, Obtener,
    /// Exportar). Hace dos cosas:
    ///   1. exige sesión: sin ella devuelve 401 a las peticiones XHR y manda
    ///      al Login a las que llegan por navegación;
    ///   2. rechaza los datos por la barra de direcciones: estas acciones
    ///      reciben todo por POST, así que una cadena de consulta solo puede
    ///      venir de alguien manipulando la URL.
    /// </summary>
    public class FiltroUrl : ActionFilterAttribute
    {
        private const string CLAVE_USUARIO = "ssUsuarioLogin";

        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            HttpContextBase contexto = filterContext.HttpContext;
            /* La cabecera la manda Http.enviar en cada llamada del aplicativo.
               Distingue una petición del JS de una navegación del usuario, y
               de eso depende si conviene un 401 o un redirect: a un XHR el
               Login le llegaría como una página HTML que no sabe leer. */
            string esXHR = contexto.Request.Headers["xhr"];
            bool desdeJavaScript = !string.IsNullOrEmpty(esXHR);

            /* Session puede ser nula si el handler corre sin estado de sesión;
               y el valor puede ser nulo si venció. Se lee como object y se
               comprueba ANTES de convertir: hacer .ToString() de una sesión
               vencida lanzaba NullReferenceException y el usuario veía un 500
               en lugar del Login. */
            object usuario = contexto.Session == null ? null : contexto.Session[CLAVE_USUARIO];
            bool haySesion = usuario != null && !string.IsNullOrEmpty(usuario.ToString());

            if (!haySesion)
            {
                filterContext.Result = desdeJavaScript
                    ? (ActionResult)new HttpStatusCodeResult(HttpStatusCode.Unauthorized, "No autorizado")
                    : new RedirectResult("~/SAHE/Login");
                return;
            }

            if (contexto.Request.QueryString.Count > 0)
            {
                filterContext.Result = desdeJavaScript
                    ? (ActionResult)new HttpStatusCodeResult(HttpStatusCode.BadRequest, "Petición no válida")
                    : new RedirectResult("~/SAHE/Login");
            }
        }
    }
}
