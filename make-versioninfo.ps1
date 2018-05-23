$major,$minor,$patch = $env:package_version.split('.')

$versionInfo = @"

1 VERSIONINFO
FILEVERSION $major,$minor,$patch,0
PRODUCTVERSION $major,$minor,$patch,0
FILEOS 0x40004
FILETYPE 0x1
{
BLOCK "StringFileInfo"
{
	BLOCK "040904b0"
	{
		VALUE "CompanyName", "8bit Solutions LLC"
		VALUE "ProductName", "Bitwarden"
		VALUE "FileDescription", "Bitwarden CLI"
		VALUE "FileVersion", "$env:package_version"
		VALUE "ProductVersion", "$env:package_version"
		VALUE "OriginalFilename", "bw.exe"
		VALUE "InternalName", "bw"
		VALUE "LegalCopyright", "Copyright 8bit Solutions LLC"
	}
}

BLOCK "VarFileInfo"
{
	VALUE "Translation", 0x0409 0x04B0  
}
}
"@

$versionInfo | Out-File ./version-info.rc
