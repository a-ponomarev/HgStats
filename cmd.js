const { execSync } = require('child_process');

exports.runCommand = (root, command) => {
    return execSync(`cd ${root} && ${command}`, {encoding: 'utf8'});
};