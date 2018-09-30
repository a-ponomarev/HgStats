﻿using System;
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
        private readonly Dictionary<string, string> authorMap;
        private readonly Dictionary<string, string> reviewerMap;
        private readonly HashSet<string> authors;
        private string CD => $"cd {hgRoot}";

        public ReviewService()
        {
            hgRoot = new SettingsService().Settings.HgRoot;
            authorMap = File.ReadAllLines(Path.Combine(hgRoot, "authormap.txt"))
                      .Select(l => l.Split('='))
                      .ToDictionary(x => x[0], x => x[1]);
            reviewerMap = File.ReadAllLines(Path.Combine(hgRoot, "reviewermap.txt"))
                              .Select(l => l.Split('='))
                              .SelectMany(x => x[0].Split(',').Select(r => new { key = r, val = x[1] }))
                              .ToDictionary(x => x.key, x => x.val);
            authors = GetAuthors();
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

        private HashSet<string> GetAuthors()
        {
            var command = $"hg log -T \"{{author}}{newLine}\"";
            var log = CmdHelper.RunViaFile(CD, command);

            return new HashSet<string>(log);
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
                    current.Author = GetAuthor(line);

                if (line.StartsWith(reviewPrefix))
                    current.Reviewers = GetReviewers(line);

                if (line == border)
                {
                    if (current.Reviewers != null && current.Reviewers.Any())
                        commits.Add(current);
                    current = new Commit();
                }
            }

            return commits;
        }

        private string GetAuthor(string line)
        {
            var currentAuthor = line.Replace(authorPrefix, string.Empty).Trim();

            return authorMap.ContainsKey(currentAuthor)
                ? authorMap[currentAuthor]
                : currentAuthor;
        }

        private List<string> GetReviewers(string line)
        {
            var currentReviewers = new List<string>();
            var rawReviewers = line
                               .Replace(reviewPrefix, string.Empty)
                               .Split(new[] { ",", " " }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var reviewer in rawReviewers)
            {
                if (reviewerMap.ContainsKey(reviewer))
                    currentReviewers.Add(reviewerMap[reviewer]);
                else if (authors.Contains(reviewer))
                    currentReviewers.Add(reviewer);
            }

            return currentReviewers;
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