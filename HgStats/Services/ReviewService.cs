using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using HgStats.Helpers;

namespace HgStats.Services
{
    public static class ReviewService
    {
        private const string authorPrefix = "author:";
        private const string reviewPrefix = "review:";
        private const string border = "-------";
        private const string newLine = @"\n";

        //https://stackoverflow.com/questions/4107625/how-can-i-convert-assembly-codebase-into-a-filesystem-path-in-c
        private static readonly string repoDir = Path.GetDirectoryName(new Uri(Assembly.GetExecutingAssembly().CodeBase).LocalPath);
        private static readonly string cd = $"cd {repoDir}";

        public static string GetData()
        {
            var commits = GetCommits();
            var info = commits.SelectMany(c => c.Review.Select(r => (author:c.Author, review:r)))
                .GroupBy(p => p)
                .Select(g => (author: g.Key.author, review: g.Key.review, count: g.Count()))
                .Where(i => i.count > 1); // todo использовать список коммитеров

            var header = $"author,review,amount,risk{Environment.NewLine}";
            return header + string.Join(Environment.NewLine, info.Select(i => $"{i.author},{i.review},{i.count},0"));
        }

        private static List<Commit> GetCommits()
        {
            var dateRange = "-d \"jan 2018 to now\" ";

            var command = $"hg log {dateRange} -T \"{authorPrefix}{{author}}{newLine}{{desc}}{newLine}{border}{newLine}\"";
            var log = CmdHelper.RunViaFile(cd, command);

            var commits = new List<Commit>();
            var current = new Commit();
            foreach (var line in log)
            {
                if (line.StartsWith(authorPrefix))
                    current.Author = line
                        .Replace(authorPrefix, string.Empty)
                        .Split('<').First()
                        .Trim();

                if (line.StartsWith(reviewPrefix))
                    current.Review = line
                        .Replace(reviewPrefix, string.Empty)
                        .Split(new[] {",", " "}, StringSplitOptions.RemoveEmptyEntries)
                        .ToList();

                if (line == border)
                {
                    if (current.Review != null)
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
        public List<string> Review { get; set; }

        public override string ToString()
        {
            return $"{nameof(Author)}: {Author}, {nameof(Review)}: {string.Join(", ", Review)}";
        }
    }
}