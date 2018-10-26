const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const { runCommand } = require('./cmd.js');

const settings = require('./settings.json');

const authorPrefix = getRandomString();
const reviewPrefix = "review:";
const border = "-------";
const newLine = "\\n";
const authorMaps = {};
const authorLists = {};
const unknownReviewers = new Set();

exports.getData = (from, to) => {
    const rootResults = _.flatten(settings.hgRoots.map(root => getRootData(root, from, to)));

    const groups = _.groupBy(rootResults, c => c.author + ' + ' + c.review);
    const total = _.map(groups, g => ({
        root: 'Total',
        author: g[0].author,
        review: g[0].review,
        amount: g.reduce((acc, el) => acc + el.amount, 0)
    }));

    return total.concat(rootResults);
};

function getRootData (root, from, to) {
    const commits = getCommits(from, to, root);
    const reviewPairs = _.flatten(commits.map(c => c.review.map(r => ({author: c.author, review: r}))));
    const groups = _.groupBy(reviewPairs, c => c.author + ' + ' + c.review);

    return _.map(groups, g => ({
        root: root,
        author: g[0].author,
        review: g[0].review || g[0].author,
        amount: g.length
    }));
}

function getCommits(from, to, root) {
    initAuthorList(root);
    initAuthorMap(root);

    const dateRange = `-d \"${from.format('YYYY-MM-DD')} to ${to.format('YYYY-MM-DD')}\" `;
    const command = `hg log ${dateRange} -T \"${authorPrefix}{author}${newLine}{desc}${newLine}${border}${newLine}\"`;
    const log = runCommand(root, command);

    let commits = [];
    let current = createEmptyCommit();
    log.split('\n').forEach(line => {
        if (line.startsWith(authorPrefix))
            current.author = getAuthor(line, root);

        if (line.startsWith(reviewPrefix))
            current.review = getReview(line, root);

        if (line === border) {
            commits.push(current);
            current = createEmptyCommit();
        }
    });

    return commits;
}

function initAuthorMap(root) {
    if (authorMaps[root])
        return;

    const mapPath = path.join(root, 'authormap.txt');
    if (!fs.existsSync(mapPath))
        return;

    authorMaps[root] = [];
    fs.readFileSync(mapPath)
        .toString()
        .split(/[\r\n]/)
        .filter(l => l)
        .forEach(line => {
            const tokens = line.split('=');
            authorMaps[root][tokens[0]] = tokens[1];
            authorLists[root].add(tokens[1]);
        });
}

function initAuthorList(root) {
    const command = `hg log -T \"{author}${newLine}\"`;
    const log = runCommand(root, command);
    authorLists[root] = new Set(log.split('\n').filter(l => l));
}

function getAuthor(line, root) {
    let author = line.replace(authorPrefix, '').trim();
    return mapAuthor(author, root);
}

function getReview(line, root) {
    const result = [];
    line.replace(reviewPrefix, '')
        .split(/[\s,]+/)
        .filter(t => t)
        .map(author => mapAuthor(author, root))
        .forEach(author => authorLists[root].has(author)
            ? result.push(author)
            : unknownReviewers.add(author));
    return result;
}

function mapAuthor(author, root) {
    const map = authorMaps[root];
    return map
        ? map[author] || author
        : author;
}

function createEmptyCommit() {
    return {review: []};
}

function getRandomString() {
    return Math.random().toString(36).substr(2);
}
