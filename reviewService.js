const _ = require('underscore');
const { execSync } = require('child_process');

const settings = require('./settings.json');

const authorPrefix = getRandomString();
const reviewPrefix = "review:";
const border = "-------";
const newLine = "\\n";

exports.getData = (from, to) => {
    return _.flatten(settings.hgRoots.map(root => getRootData(root, from, to)));
};

function getRootData (root, from, to) {
    let commits = getCommits(from, to, root);
    const groups = _.groupBy(commits, c => c.author + ' + ' + c.review);

    return _.map(groups, g => {
        return {root: root, author: g[0].author, review: g[0].review || g[0].author, amount: g.length};
    });
}

function getCommits(from, to, root) {
    const dateRange = `-d \"${from.format('YYYY-MM-DD')} to ${to.format('YYYY-MM-DD')}\" `;
    const command = `hg log ${dateRange} -T \"${authorPrefix}{author}${newLine}{desc}${newLine}${border}${newLine}\"`;
    const log = runCommand(root, command);

    let commits = [];
    let current = {};
    log.split('\n').forEach(line => {
        if (line.startsWith(authorPrefix))
            current.author = line.replace(authorPrefix, '').trim();

        if (line.startsWith(reviewPrefix))
            current.review = line.replace(reviewPrefix, '').trim();

        if (line === border) {
            commits.push(current);
            current = {};
        }
    });

    return commits;
}

function runCommand(root, command) {
    const fullCommand = `cd ${root} && ${command}`;
    return execSync(fullCommand, {encoding: 'utf8'});
}

function getRandomString() {
    return Math.random().toString(36).substr(2);
}
