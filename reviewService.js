exports.getData = (from, to) => {
   return [
       {root: 'C:\\OneRepo', author:'a', review: 'b', amount: 10},
       {root: 'C:\\OneRepo', author:'a', review: 'c', amount: 5},
       {root: 'C:\\OneRepo', author:'a', review: 'd', amount: 6},
       {root: 'C:\\OneRepo', author:'c', review: 'a', amount: 3},
       {root: 'C:\\OneRepo', author:'c', review: 'b', amount: 2},
       {root: 'C:\\OtherRepo', author:'a', review: 'c', amount: 5},
       {root: 'C:\\OtherRepo', author:'a', review: 'd', amount: 6},
       {root: 'C:\\OtherRepo', author:'c', review: 'a', amount: 3}
   ]
}