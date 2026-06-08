$ErrorActionPreference = 'Stop'
$source = 'C:\Windows\System32\CodeIntegrity\SIPolicy.p7b'
$output = 'C:\Users\24344\Desktop\my-ai-fire\SIPolicy-inspection.xml'
$log = 'C:\Users\24344\Desktop\my-ai-fire\SIPolicy-inspection.log'

try {
    Import-Module ConfigCI
    ConvertFrom-CIPolicy -BinaryFilePath $source -XmlFilePath $output
    "Converted $source to $output" | Set-Content -LiteralPath $log -Encoding UTF8
} catch {
    ($_ | Out-String) | Set-Content -LiteralPath $log -Encoding UTF8
    throw
}
