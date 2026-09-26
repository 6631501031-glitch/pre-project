$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=Join-Path (Get-Location) 'deliverables/graduation-paper'
$target=Join-Path $root 'Graduation_Project_Paper_English.docx'
Copy-Item -LiteralPath (Join-Path $root 'Graduation_Paper_English.docx') -Destination $target -Force
$z=[System.IO.Compression.ZipFile]::Open($target,[System.IO.Compression.ZipArchiveMode]::Update)
$r=New-Object System.IO.StreamReader($z.GetEntry('word/document.xml').Open());[xml]$x=$r.ReadToEnd();$r.Dispose()
$w=$x.DocumentElement.GetNamespaceOfPrefix('w')
foreach($t in $x.SelectNodes('//*[local-name()="t"]')) {
 if($t.InnerText -match '^(663150\d+)@lamduan\.mfu\.ac\.th$') {
  $t.InnerText='Student ID: '+$Matches[1]
  $p=$t.ParentNode.ParentNode
  $newP=$p.CloneNode($true)
  $newP.SelectSingleNode('.//*[local-name()="t"]').InnerText='Email: ____________________'
  [void]$p.ParentNode.InsertAfter($newP,$p)
 }
 elseif($t.InnerText -eq 'CE'){$t.InnerText=''}
}
$xml=$x.OuterXml
if($xml.Contains('ARCHITECTURE_FIGURE_PLACEHOLDER')){throw 'Figure is missing'}
$z.GetEntry('word/document.xml').Delete()
$e=$z.CreateEntry('word/document.xml');$wr=New-Object System.IO.StreamWriter($e.Open(),(New-Object System.Text.UTF8Encoding($false)));$wr.Write($xml);$wr.Dispose()
$z.Dispose()
Write-Output $target
