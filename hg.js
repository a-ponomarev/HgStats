const fs = require('fs');
const path = require('path');
const { runCommand } = require('./cmd.js');

const authorPrefix = getRandomString();
const reviewPrefix = "review:";
const border = "-------";
const newLine = "\\n";
const authorMaps = {};
const authorLists = {};
const unknownReviewers = {};

exports.getCommits = getCommits;
exports.unknownReviewers = unknownReviewers;

function getCommits(from, to, root) {
    const dirPath = 'app_data';
    const filePath = path.join(dirPath, `repo-${path.basename(root)}-${from.format('YYYY-MM-DD')}-${to.format('YYYY-MM-DD')}.json`);

    if (!fs.existsSync(dirPath))
        fs.mkdirSync(dirPath);

    if (!fs.existsSync(filePath)) {
        const commits = getCommitsInternal(from, to, root);
        fs.writeFileSync(filePath, JSON.stringify(commits, null, 2));
        return commits;
    } else {
        return JSON.parse(fs.readFileSync(filePath, {encoding: 'utf8'})); 
    }
}

function getCommitsInternal(from, to, root) {
    initAuthorList(root);
    initAuthorMap(root);
    unknownReviewers[root] = new Set();

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
            : unknownReviewers[root].add(author));
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
