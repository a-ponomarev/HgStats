using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using HgStats.Services;
using Newtonsoft.Json;

namespace HgStats.Controllers
{
    public class ReviewController : Controller
    {
        public ActionResult Data(string from, string to)
        {
            var lines = GetData(from, to).Select(d => new {d.root, d.author, review = d.reviewer, amount = d.count});

            return Content(JsonConvert.SerializeObject(lines));
        }

        private static IEnumerable<(string root, string author, string reviewer, int count)> GetData(string @from, string to)
        {
            var rawData = ReviewServiceCollection.Services.SelectMany(s => s.GetData(from, to)).ToArray();
            var total = rawData.GroupBy(d => (d.author, d.reviewer)).Select(g =>
                (root: "Total", g.Key.author, g.Key.reviewer, count: g.Sum(r => r.count)));

            return total.Concat(rawData);
        }
    }
}