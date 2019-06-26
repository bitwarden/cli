param (
    [Parameter(Mandatory=$true)]
    [string] $version
)

# Dependencies:
# 1. Install powershell, ex `sudo apt-get install -y powershell`
#
# To run:
# ./snap-build.ps1 -version 1.1.0
#
# and then push to snap with:
# cd ../dist/snap
# snap push bw*.snap
# or, use the ./snap-update.ps1 script

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = $dir + "/.."
$distDir = $rootDir + "/dist"
$snapDir = $rootDir + "/stores/snap"
$distSnapDir = $distDir + "/snap"
$snapDistYaml = $distSnapDir + "/snapcraft.yaml"

if(Test-Path -Path $distSnapDir) {
  Remove-Item -Recurse -Force $distSnapDir
}

Copy-Item -Path $snapDir -Destination $distSnapDir –Recurse
(Get-Content $snapDistYaml).replace('__version__', $version) | Set-Content $snapDistYaml
cd $distSnapDir
snapcraft
cd $rootDir
