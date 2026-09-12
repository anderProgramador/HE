using System.Net;
using System.Web;
using System.Web.Mvc;

namespace SAHE.Filtros
{
    public class FiltroAutenticacion : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            HttpRequestBase metodoRequest = filterContext.HttpContext.Request;
            string esXHR = metodoRequest.Headers["xhr"];
            if (filterContext.HttpContext.Session["ssUsuarioLogin"] == null)
            {
                if (!string.IsNullOrEmpty(esXHR)) filterContext.Result = new HttpStatusCodeResult(HttpStatusCode.Unauthorized, "No autorizado");
                else  filterContext.Result = new RedirectResult("~/SAHE/Login");
            }
        }
    }
}