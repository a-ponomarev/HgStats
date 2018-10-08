using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using HgStats.Services;

namespace HgStats.Controllers
{
    public class ReviewController : Controller
    {
        private readonly Dictionary<string, ReviewService> reviewServices;

        public ReviewController()
        {
            var hgRoots = new SettingsService().Settings.HgRoots;
            reviewServices = hgRoots.ToDictionary(r => r, r => new ReviewService(r));
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Data(string from, string to)
        {
            var header = $"root,author,review,amount{Environment.NewLine}";

            var data = reviewServices.SelectMany(s =>
                s.Value.GetData(from, to)
                    .Select(d => $"{s.Key},{d.author},{d.reviewer},{d.count}"));

            return Content(header + string.Join(Environment.NewLine, data));
        }
    }
}