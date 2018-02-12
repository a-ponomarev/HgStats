﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using HgStats.Helpers;

namespace HgStats.Services
{
    public static class ReviewService
    {
        private const string authorPrefix = "author:";
        private const string reviewPrefix = "review:";
        private const string border = "-------";
        private const string newLine = @"\r\n";
        private const string rawFile = "raw.txt";
        
        public static string GetData()
        {
            var commits = GetCommits();
            var info = commits.SelectMany(c => c.Review.Select(r => (author:c.Author, review:r)))
                .GroupBy(p => p)
                .Select(g => (author: g.Key.author, review: g.Key.review, count: g.Count()))
                .Where(i => i.count > 1); // todo использовать список коммитеров
            
            var header = $"creditor,debtor,amount,risk{Environment.NewLine}";
            return header + string.Join(Environment.NewLine, info.Select(i => $"{i.author},{i.review},{i.count},0"));
        }

        private static List<Commit> GetCommits()
        {
            var dateRange = $"-d \"jan 2018 to now\" ";
            var command = $"hg log {dateRange} -T \"{authorPrefix}{{author}}{newLine}{{desc}}{newLine}{border}{newLine}\" > {rawFile}";
            CmdHelper.Run(command);
            var log = File.ReadAllLines(rawFile); 

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