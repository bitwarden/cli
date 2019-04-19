[![appveyor build](https://ci.appveyor.com/api/projects/status/github/bitwarden/cli?branch=master&svg=true)](https://ci.appveyor.com/project/bitwarden/cli)
[![Join the chat at https://gitter.im/bitwarden/Lobby](https://badges.gitter.im/bitwarden/Lobby.svg)](https://gitter.im/bitwarden/Lobby)

# Bitwarden Command-line Interface

[![Platforms](https://imgur.com/AnTLX0S.png "Platforms")](https://help.bitwarden.com/article/cli/#download--install)

The Bitwarden CLI is a powerful, full-featured command-line interface (CLI) tool to access and manage a Bitwarden vault. The CLI is written with TypeScript and Node.js and can be run on Windows, macOS, and Linux distributions.

![CLI](https://raw.githubusercontent.com/bitwarden/brand/master/screenshots/cli-macos.png "CLI")

## Download/Install

You can install the Bitwarden CLI multiple different ways:

**NPM**

If you already have the Node.js runtime installed on your system, you can install the CLI using NPM. NPM makes it easy to keep your installation updated and should be the preferred installation method if you are already using Node.js.

```bash
npm install -g @bitwarden/cli
```

**Native Executable**

We provide natively packaged versions of the CLI for each platform which have no requirements on installing the Node.js runtime. You can obtain these from the [downloads section](https://help.bitwarden.com/article/cli/#download--install) in the documentation.

**Other Package Managers**

- [Chocolatey](https://chocolatey.org/packages/bitwarden-cli)
  ```powershell
  choco install bitwarden-cli
  ```
- [Homebrew](https://formulae.brew.sh/formula/bitwarden-cli)
  ```bash
  brew install bitwarden-cli
  ```
- [Snap](https://snapcraft.io/bw)
  ```bash
  sudo snap install bw
  ```

## Documentation

The Bitwarden CLI is self-documented with `--help` content and examples for every command. You should start exploring the CLI by using the global `--help` option:

```bash
bw --help
```

This option will list all available commands that you can use with the CLI.

Additionally, you can run the `--help` option on a specific command to learn more about it:

```bash
bw list --help
bw create --help
```

**Detailed Documentation**

We provide detailed documentation and examples for using the CLI in our help center at https://help.bitwarden.com/article/cli/.

## Build/Run

**Requirements**

- [Node.js](https://nodejs.org/)

**Run the app**

```bash
npm install
npm run sub:init # initialize the git submodule for jslib
npm run build:watch
```

You can then run commands from the `./build` folder:

```bash
node ./build/bw.js login
```

## Contribute

Code contributions are welcome! Please commit any pull requests against the `master` branch. Learn more about how to contribute by reading the [`CONTRIBUTING.md`](CONTRIBUTING.md) file.

Security audits and feedback are welcome. Please open an issue or email us privately if the report is sensitive in nature. You can read our security policy in the [`SECURITY.md`](SECURITY.md) file.
