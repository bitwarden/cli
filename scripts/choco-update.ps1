param (
    [Parameter(Mandatory=$true)]
    [string] $version
)

# To run:
# .\choco-update.ps1 -version 1.3.0

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path;
$rootDir = $dir + "\..";
$distDir = $rootDir + "\dist";
$distChocoDir = $distDir + "\chocolatey";

if(Test-Path -Path $distChocoDir) {
  Remove-Item -Recurse -Force $distChocoDir
}
New-Item -ItemType directory -Path $distChocoDir | Out-Null

$nupkg = "bitwarden-cli." + $version + ".nupkg"
$uri = "https://github.com/bitwarden/cli/releases/download/v" + $version + "/" + $nupkg;
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-RestMethod -Uri $uri -OutFile $($distChocoDir + "\" + $nupkg)

cd $distChocoDir
choco push
cd $rootDir
