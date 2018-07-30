using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using HgStats.Helpers;

namespace HgStats.Services
{
    public class ReviewService
    {
        private static readonly string authorPrefix = Guid.NewGuid().ToString();
        private const string reviewPrefix = "review:";
        private const string border = "-------";
        private const string newLine = @"\n";

        private readonly string hgRoot;
        private readonly Dictionary<string, string> map;
        private string CD => $"cd {hgRoot}";

        public ReviewService()
        {
            //https://stackoverflow.com/questions/4107625/how-can-i-convert-assembly-codebase-into-a-filesystem-path-in-c
            var assemblyDir = Path.GetDirectoryName(new Uri(Assembly.GetExecutingAssembly().CodeBase).LocalPath);

            hgRoot = CmdHelper.Run($"cd {assemblyDir}", "hg root").First();
            map = File.ReadAllLines(Path.Combine(hgRoot, "authormap.txt"))
                      .Select(l => l.Split('='))
                      .ToDictionary(x => x[0], x => x[1]);
        }

        public string GetData()
        {
            var commits = GetCommits();
            var info = commits
                       .SelectMany(c => c.Reviewers.Select(r => new { author = c.Author, reviewer = r }))
                       .GroupBy(p => p)
                       .Select(g => new { g.Key.author, g.Key.reviewer, count = g.Count() });

            var header = $"author,review,amount,risk{Environment.NewLine}";
            return header + string.Join(Environment.NewLine, info.Select(i => $"{i.author},{i.reviewer},{i.count},0"));
        }

        private List<Commit> GetCommits()
        {
            var dateRange = "-d \"jan 2018 to now\" ";

            var command = $"hg log {dateRange} -T \"{authorPrefix}{{author}}{newLine}{{desc}}{newLine}{border}{newLine}\"";
            var log = CmdHelper.RunViaFile(CD, command);

            var commits = new List<Commit>();
            var current = new Commit();
            foreach (var line in log)
            {
                if (line.StartsWith(authorPrefix))
                {
                    var currentAuthor = line.Replace(authorPrefix, string.Empty).Trim();
                    if (map.ContainsKey(currentAuthor))
                        currentAuthor = map[currentAuthor];

                    current.Author = currentAuthor;
                }

                if (line.StartsWith(reviewPrefix))
                    current.Reviewers = line
                                        .Replace(reviewPrefix, string.Empty)
                                        .Split(new[] { ",", " " }, StringSplitOptions.RemoveEmptyEntries)
                                        .ToList();

                if (line == border)
                {
                    if (current.Reviewers != null)
                        commits.Add(current);
                    current = new Commit();
                }
            }

            return commits;
        }
    }

    public class Commit
    {
        public string Author { get; set; }
        public List<string> Reviewers { get; set; }

        public override string ToString()
        {
            return $"{nameof(Author)}: {Author}, {nameof(Reviewers)}: {string.Join(", ", Reviewers)}";
        }
    }
}