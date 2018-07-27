param (
    [Parameter(Mandatory=$true)]
    [string] $version
)

# Dependencies:
# 1. brew cask install powershell
#
# To run:
# pwsh ./brew-update.ps1 -version 1.1.0

$url = 'https://registry.npmjs.org/@bitwarden/cli/-/cli-' + $version + '.tgz';
brew bump-formula-pr --url="$url" bitwarden-cli
