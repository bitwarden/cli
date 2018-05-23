# To run:
# .\choco-pack.ps1
#
# and then push to choco with:
# cd ..\dist\chocolatey
# choco push

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path;
$rootDir = $dir + "\..";
$distDir = $rootDir + "\dist";
$chocoDir = $rootDir + "\stores\chocolatey";
$distChocoDir = $distDir + "\chocolatey";
$distChocoToolsDir = $distDir + "\chocolatey\tools";

if(Test-Path -Path $distChocoDir) {
  Remove-Item -Recurse -Force $distChocoDir
}

$exe = $distDir + "\windows\bw.exe";
Copy-Item -Path $chocoDir -Destination $distChocoDir –Recurse
Copy-Item $exe -Destination $distChocoToolsDir;

$srcPackage = $rootDir + "\package.json";
$srcPackageVersion = (Get-Content -Raw -Path $srcPackage | ConvertFrom-Json).version;
$nuspec = $distChocoDir + "\bitwarden-cli.nuspec";
choco pack $nuspec --version $srcPackageVersion --out $distChocoDir
