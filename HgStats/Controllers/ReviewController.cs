using System.Web.Mvc;
using HgStats.Services;

namespace HgStats.Controllers
{
    public class ReviewController : Controller
    {
        private readonly ReviewService reviewService;

        public ReviewController()
        {
            reviewService = new ReviewService();
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Data(string from, string to)
        {
            return Content(reviewService.GetData(from, to));
        }
    }
}