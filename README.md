# HgStats
Yet another tool for tracking statistics in Mercurial VCS.
For now the only implemented feature is chord review diagrams.

## To Use

Prerequisites:
- [Git](https://git-scm.com)
- [Mercurial](https://www.mercurial-scm.org/)
- [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com))

```bash
# Clone this repository
git clone https://github.com/a-ponomarev/HgStats
# Go into the repository
cd HgStats
# Install dependencies
npm install
# Set up settings.json
{
  "hgRoots": [
    ".\\TestRepoOne",
    ".\\TestRepoTwo"
  ]
}
# Run the app
npm start
```

Additional tools
```bash
# To analyze authors and build authormap.txt
node .\getAuthors.js
```

## To Develop
```bash
# If you need to generate test repos
npm test
```
