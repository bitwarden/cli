> **Repository Reorganization in Progress**
>
> We are currently migrating some projects over to a mono repository. For existing PR's we will be providing documentation on how to move/migrate them. To minimize the overhead we are actively reviewing open PRs. If possible please ensure any pending comments are resolved as soon as possible.
>
> New pull requests created during this transition period may not get addressed —if needed, please create a new PR after the reorganization is complete.

[![Github Workflow build on master](https://github.com/bitwarden/cli/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/bitwarden/cli/actions/workflows/build.yml?query=branch:master)
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

- [Node.js](https://nodejs.org) v16.13.1.
  - Testing is done against Node 16, other versions may work, but are not guaranteed.
- NPM v8

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

## We're Hiring!

Interested in contributing in a big way? Consider joining our team! We're hiring for many positions. Please take a look at our [Careers page](https://bitwarden.com/careers/) to see what opportunities are currently open as well as what it's like to work at Bitwarden.

## Contribute

Code contributions are welcome! Please commit any pull requests against the `master` branch. Learn more about how to contribute by reading the [`CONTRIBUTING.md`](CONTRIBUTING.md) file.

Security audits and feedback are welcome. Please open an issue or email us privately if the report is sensitive in nature. You can read our security policy in the [`SECURITY.md`](SECURITY.md) file.

## Prettier

We recently migrated to using Prettier as code formatter. All previous branches will need to updated to avoid large merge conflicts using the following steps:

1. Check out your local Branch
2. Run `git merge ec53a16c005e0dd9aef6845c18811e8b14067168`
3. Resolve any merge conflicts, commit.
4. Run `npm run prettier`
5. Commit
6. Run `git merge -Xours 910b4a24e649f21acbf4da5b2d422b121d514bd5`
7. Push

### Git blame

We also recommend that you configure git to ignore the prettier revision using:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```
