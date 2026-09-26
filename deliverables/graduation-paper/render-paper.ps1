$ErrorActionPreference='Stop'
$root=Join-Path (Get-Location) 'deliverables/graduation-paper'
$word=New-Object -ComObject Word.Application
$word.Visible=$false
$word.DisplayAlerts=0
try {
 $doc=$word.Documents.Open((Join-Path $root 'Graduation_Paper_English.docx'))
 $range=$doc.Content
 $range.Find.ClearFormatting()
 if($range.Find.Execute('ARCHITECTURE_FIGURE_PLACEHOLDER')){
  $range.Text=''
  $picture=$doc.InlineShapes.AddPicture((Join-Path $root 'architecture.png'),$false,$true,$range)
  $picture.LockAspectRatio=-1
  $picture.Width=240
 }
 $doc.Fields.Update() | Out-Null
 $doc.Repaginate()
 $doc.Save()
 $doc.ExportAsFixedFormat((Join-Path $root 'Graduation_Paper_English.pdf'),17)
 $pages=$doc.ComputeStatistics(2)
 Write-Output "Pages: $pages"
 for($i=1;$i -le $pages;$i++){
   $r=$doc.GoTo(1,1,$i)
   $start=$r.Start
   $end=if($i -lt $pages){$doc.GoTo(1,1,($i+1)).Start}else{$doc.Content.End}
   $text=$doc.Range($start,$end).Text
   Write-Output ("PAGE {0}: {1}" -f $i, $text.Substring(0,[Math]::Min(130,$text.Length)).Replace("`r",' '))
 }
 $doc.Close(0)
} finally {$word.Quit();[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)}
