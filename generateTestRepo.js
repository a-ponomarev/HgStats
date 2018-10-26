const fs = require('fs');
const { runCommand } = require('./cmd.js');

const data = require('.\\testRepoData.json');

for (const root in data) if (data.hasOwnProperty(root))
{
    if (fs.existsSync(root)) {
        console.log(`${root} already exists. Script aborted.`);
        return;
    }

    const fileName = 'file.txt';
    
    fs.mkdirSync(root);
    runCommand(root, 'hg init');
    runCommand(root, `copy NUL ${fileName}`);
    runCommand(root, `hg add ${fileName}`);

    const total = data[root].reduce((acc, el) => acc + el.amount, 0);
    let created = 0;

    data[root].forEach(raw => {
        for (let i = 0; i < raw.amount; i++) {
            runCommand(root, `echo ${Math.random()} > ${fileName}`);            
            runCommand(root, `hg commit -u ${raw.author} -m "review: ${raw.review}" -I *`);
            console.log(`${root}: ${++created}/${total}`);
        }
    });
}
