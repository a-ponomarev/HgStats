const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const hg = require('./hg');

const settings = require('./settings.json');

settings.hgRoots.forEach(root => {
    console.log(root);

    console.log('Getting commits...');
    const filename = `authors-${path.basename(root) }.txt`;
    const commits = hg.getCommits(moment().subtract(20, 'year'), moment(),root);

    console.log('Writing to file...');
    const content = 'AUTHORS\n' +
        [...new Set(commits.map(c => c.author))].join('\n') +
        '\n\nREVIEWERS\n' +
        [...new Set(_.flatten(commits.map(c => c.review)))].join('\n') +
        '\n\nUNKNOWN\n' +
        [...hg.unknownReviewers[root]].join('\n');
    fs.writeFileSync(filename, content);
});