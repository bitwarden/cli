$major,$minor,$patch = $env:PACKAGE_VERSION.split('.')

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
		VALUE "CompanyName", "Bitwarden Inc."
		VALUE "ProductName", "Bitwarden"
		VALUE "FileDescription", "Bitwarden CLI"
		VALUE "FileVersion", "$env:PACKAGE_VERSION"
		VALUE "ProductVersion", "$env:PACKAGE_VERSION"
		VALUE "OriginalFilename", "bw.exe"
		VALUE "InternalName", "bw"
		VALUE "LegalCopyright", "Copyright Bitwarden Inc."
	}
}

BLOCK "VarFileInfo"
{
	VALUE "Translation", 0x0409 0x04B0  
}
}
"@

$versionInfo | Out-File ./version-info.rc
