using System;
using System.Collections.Generic;
using System.Linq;
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

        public ActionResult Data(string from, string to)
        {
            var header = $"root,author,review,amount{Environment.NewLine}";

            var data = ReviewServiceCollection.Services.SelectMany(s =>
                s.GetData(from, to).Select(d => $"{d.root},{d.author},{d.reviewer},{d.count}"));

            return Content(header + string.Join(Environment.NewLine, data));
        }
    }
}