const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const settings = require('./settings.json');

const authorPrefix = getRandomString();
const reviewPrefix = "review:";
const border = "-------";
const newLine = "\\n";
const authorMaps = {};

exports.getData = (from, to) => {
    return _.flatten(settings.hgRoots.map(root => getRootData(root, from, to)));
};

function getRootData (root, from, to) {
    const commits = getCommits(from, to, root);
    const reviewPairs = _.flatten(commits.map(c => c.review.map(r => ({author: c.author, review: r}))));
    const groups = _.groupBy(reviewPairs, c => c.author + ' + ' + c.review);

    return _.map(groups, g => ({root: root, author: g[0].author, review: g[0].review || g[0].author, amount: g.length}));
}

function getCommits(from, to, root) {
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
    if(authorMaps[root])
        return;

    authorMaps[root] = [];
    fs.readFileSync(path.join(root, 'authormap.txt'))
        .toString()
        .split("\n")
        .forEach(line => {
            const tokens = line.split('=');
            authorMaps[root][tokens[0]] = tokens[1];
        });
}

function getAuthor(line, root) {
    let author = line.replace(authorPrefix, '').trim();
    return mapAuthor(author, root);
}

function getReview(line, root) {
    let tokens = line.replace(reviewPrefix, '').split(/[\s,]+/);
    return _.filter(tokens, t => t).map(author => mapAuthor(author, root));
}

function mapAuthor(author, root) {
    return authorMaps[root][author] || author;
}

function createEmptyCommit() {
    return {review: []};
}

function runCommand(root, command) {
    const fullCommand = `cd ${root} && ${command}`;
    return execSync(fullCommand, {encoding: 'utf8'});
}

function getRandomString() {
    return Math.random().toString(36).substr(2);
}
