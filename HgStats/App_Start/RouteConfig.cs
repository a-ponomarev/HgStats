using System.Web.Mvc;
using System.Web.Routing;

namespace HgStats
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                "Default",
                "{controller}/{action}/{id}",
                new {controller = "Review", action = "Index", id = UrlParameter.Optional},
                new[] {"HgStats.Controllers"}
            );
        }
    }
}