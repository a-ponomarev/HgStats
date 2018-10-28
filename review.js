const _ = require('underscore');
const hg = require('./hg.js');

const settings = require('./settings.json');

exports.getData = getData;

function getData(from, to) {
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
    const commits = hg.getCommits(from, to, root);
    const reviewPairs = _.flatten(commits.map(c => c.review.map(r => ({author: c.author, review: r}))));
    const groups = _.groupBy(reviewPairs, c => c.author + ' + ' + c.review);

    return _.map(groups, g => ({
        root: root,
        author: g[0].author,
        review: g[0].review || g[0].author,
        amount: g.length
    }));
}