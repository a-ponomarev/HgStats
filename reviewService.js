const settings = require('./settings.json');

exports.getData = (from, to) => {
    return settings.hgRoots.map(root => [
       {root: root, author:'a', review: 'b', amount: 10},
       {root: root, author:'a', review: 'c', amount: 5},
       {root: root, author:'a', review: 'd', amount: 6},
       {root: root, author:'c', review: 'a', amount: 3},
       {root: root, author:'c', review: 'b', amount: 2}
   ]).reduce((a,b) => a.concat(b));
};