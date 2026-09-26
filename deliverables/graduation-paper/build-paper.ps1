$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing
$root=Join-Path (Get-Location) 'deliverables/graduation-paper'
$png=Join-Path $root 'architecture.png'
$bmp=New-Object System.Drawing.Bitmap(1000,660)
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.SmoothingMode='AntiAlias'
$font=New-Object System.Drawing.Font('Arial',25)
$small=New-Object System.Drawing.Font('Arial',22)
$pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45,55,70),3)
$brush=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239,243,249))
$format=New-Object System.Drawing.StringFormat
$format.Alignment='Center';$format.LineAlignment='Center'
function Box($x,$y,$w,$h,$text){$r=New-Object System.Drawing.RectangleF($x,$y,$w,$h);$g.FillRectangle($brush,$r);$g.DrawRectangle($pen,$x,$y,$w,$h);$g.DrawString($text,$font,[System.Drawing.Brushes]::Black,$r,$format)}
function Arrow($x1,$y1,$x2,$y2){$g.DrawLine($pen,$x1,$y1,$x2,$y2);$g.FillPolygon([System.Drawing.Brushes]::Black,[System.Drawing.Point[]]@((New-Object System.Drawing.Point($x2,$y2)),(New-Object System.Drawing.Point(($x2-9),($y2-15))),(New-Object System.Drawing.Point(($x2+9),($y2-15)))))}
Box 25 20 435 140 "Student browser`nForms and face enrollment"
Box 540 20 435 140 "Administrator browser`nRoster, camera, face matching"
Arrow 242 160 242 260
Arrow 758 160 758 260
Box 25 260 950 135 "Node.js / Express API`nAuthentication, validation, ownership, summaries, receipts"
Arrow 242 395 242 495
Arrow 758 395 758 495
Box 25 495 435 125 "MongoDB`nRegistrations and latest check-ins"
Box 540 495 435 125 "Identity integration`nLocal sessions and IAM services"
$g.DrawString('Registration requests',[System.Drawing.Font]$small,[System.Drawing.Brushes]::Black,35,190)
$g.DrawString('Gallery / attendance requests',[System.Drawing.Font]$small,[System.Drawing.Brushes]::Black,550,190)
$bmp.Save($png,[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$bmp.Dispose();$font.Dispose();$small.Dispose();$pen.Dispose();$brush.Dispose();$format.Dispose()
$template='C:\Users\ASUS\Downloads\Example Template (1)\Example Template\Paper Template\Final Document in Paper template.docx'
$out=Join-Path $root 'Graduation_Paper_English.docx'
Copy-Item -LiteralPath $template -Destination $out -Force
$zip=[System.IO.Compression.ZipFile]::Open($out,[System.IO.Compression.ZipArchiveMode]::Update)
function ReadXml($name){$r=New-Object System.IO.StreamReader($zip.GetEntry($name).Open());$v=$r.ReadToEnd();$r.Dispose();return $v}
[xml]$doc=ReadXml 'word/document.xml'
$w=$doc.DocumentElement.GetNamespaceOfPrefix('w')
$body=$doc.SelectSingleNode('//*[local-name()="body"]')
$sections=$doc.SelectNodes('//*[local-name()="sectPr"]')
$first=$sections[0].CloneNode($true)
$last=$sections[3].CloneNode($true)
foreach($n in @($first.SelectNodes('./*[local-name()="footerReference" or local-name()="headerReference" or local-name()="titlePg"]'))){[void]$first.RemoveChild($n)}
function El($name){return $doc.CreateElement('w',$name,$w)}
function Attr($el,$name,$value){[void]$el.SetAttribute($name,$w,[string]$value)}
function Para($style,$text){
 $p=El 'p';$pr=El 'pPr';$st=El 'pStyle';Attr $st 'val' $style;[void]$pr.AppendChild($st)
 if($style -eq 'references'){$num=El 'numPr';$id=El 'numId';Attr $id 'val' '0';[void]$num.AppendChild($id);[void]$pr.AppendChild($num)}
 [void]$p.AppendChild($pr);$r=El 'r';$t=El 't';$t.InnerText=$text;[void]$r.AppendChild($t);[void]$p.AppendChild($r);return $p
}
$body.RemoveAll()
$blocks=Get-Content (Join-Path $root 'paper-content.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($block in $blocks){
 if($block.section){$p=Para 'Normal' '';[void]$p.FirstChild.AppendChild($first);[void]$body.AppendChild($p)}
 elseif($block.figure){[void]$body.AppendChild((Para 'Normal' 'ARCHITECTURE_FIGURE_PLACEHOLDER'))}
 elseif($block.authorTable){
 $table=El 'tbl';$props=El 'tblPr';$width=El 'tblW';Attr $width 'w' '4860';Attr $width 'type' 'dxa';[void]$props.AppendChild($width)
 $borders=El 'tblBorders';foreach($side in @('top','left','bottom','right','insideH','insideV')){$edge=El $side;Attr $edge 'val' 'nil';[void]$borders.AppendChild($edge)};[void]$props.AppendChild($borders);[void]$table.AppendChild($props)
 $grid=El 'tblGrid';foreach($cw in @(1620,1620,1620)){$gc=El 'gridCol';Attr $gc 'w' $cw;[void]$grid.AppendChild($gc)}
 [void]$table.AppendChild($grid)
 foreach($row in $block.authorTable){$tr=El 'tr';$col=0;foreach($value in $row){$tc=El 'tc';$tcp=El 'tcPr';$tw=El 'tcW';Attr $tw 'w' '1620';Attr $tw 'type' 'dxa';[void]$tcp.AppendChild($tw);[void]$tc.AppendChild($tcp);$lines=([string]$value -split "`n");foreach($line in $lines){[void]$tc.AppendChild((Para 'Author' $line))};[void]$tr.AppendChild($tc);$col++};[void]$table.AppendChild($tr)}
 [void]$body.AppendChild($table);[void]$body.AppendChild((Para 'Normal' ''))
 }
 elseif($block.table){
 $table=El 'tbl';$props=El 'tblPr';$width=El 'tblW';Attr $width 'w' '4860';Attr $width 'type' 'dxa';[void]$props.AppendChild($width)
 $borders=El 'tblBorders';foreach($side in @('top','left','bottom','right','insideH','insideV')){$edge=El $side;Attr $edge 'val' 'single';Attr $edge 'sz' '4';Attr $edge 'color' 'B5B5B5';[void]$borders.AppendChild($edge)};[void]$props.AppendChild($borders);[void]$table.AppendChild($props)
 $grid=El 'tblGrid';foreach($cw in @(2100,2760)){$gc=El 'gridCol';Attr $gc 'w' $cw;[void]$grid.AppendChild($gc)};[void]$table.AppendChild($grid)
 $index=0
 foreach($row in $block.table){$tr=El 'tr';$trpr=El 'trPr';[void]$trpr.AppendChild((El 'cantSplit'));if($index -eq 0){[void]$trpr.AppendChild((El 'tblHeader'))};[void]$tr.AppendChild($trpr)
 $col=0;foreach($value in $row){$tc=El 'tc';$tcp=El 'tcPr';$tw=El 'tcW';Attr $tw 'w' (@(2100,2760)[$col]);Attr $tw 'type' 'dxa';[void]$tcp.AppendChild($tw);[void]$tc.AppendChild($tcp);$style=if($index -eq 0){'tablecolhead'}else{'tablecopy'};[void]$tc.AppendChild((Para $style $value));[void]$tr.AppendChild($tc);$col++};[void]$table.AppendChild($tr);$index++}
 [void]$body.AppendChild($table);[void]$body.AppendChild((Para 'Normal' ''))
 }else{[void]$body.AppendChild((Para $block.style $block.text))}
}
[void]$body.AppendChild($last)
$zip.GetEntry('word/document.xml').Delete()
$entry=$zip.CreateEntry('word/document.xml')
$writer=New-Object System.IO.StreamWriter($entry.Open(),(New-Object System.Text.UTF8Encoding($false)))
$writer.Write($doc.OuterXml);$writer.Dispose();$zip.Dispose()
Write-Output "Created $out"
