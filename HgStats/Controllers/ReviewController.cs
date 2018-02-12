using System.Web.Mvc;
using HgStats.Services;

namespace HgStats.Controllers
{
    public class ReviewController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Data()
        {
            return Content(ReviewService.GetData());
        }
    }
}