[![appveyor build](https://ci.appveyor.com/api/projects/status/github/bitwarden/cli?branch=master&svg=true)](https://ci.appveyor.com/project/bitwarden/cli)
[![travis build](https://travis-ci.org/bitwarden/cli.svg?branch=master)](https://travis-ci.org/bitwarden/cli)
[![Join the chat at https://gitter.im/bitwarden/Lobby](https://badges.gitter.im/bitwarden/Lobby.svg)](https://gitter.im/bitwarden/Lobby)

# Bitwarden Command-line Interface

<a href="https://bitwarden.com/#download"><img src="https://imgur.com/SLv9paA.png" width="500" height="113"></a>

The Bitwarden CLI is written in NodeJS with TypeScript. The CLI can be run on Windows, macOS, and Linux distributions.

# Build/Run

**Requirements**

- [Node.js](https://nodejs.org/)

**Run the app**

```bash
npm install
npm run build:watch
```

You can then run commands from the `./build` folder:

```bash
node ./build/bw.js login
```

# Contribute

Code contributions are welcome! Please commit any pull requests against the `master` branch. Learn more about how to contribute by reading the [`CONTRIBUTING.md`](CONTRIBUTING.md) file.

Security audits and feedback are welcome. Please open an issue or email us privately if the report is sensitive in nature. You can read our security policy in the [`SECURITY.md`](SECURITY.md) file.
