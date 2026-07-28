Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'settings-popup-reference.jpg'
$outputDir = Join-Path $root 'assets\ui'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function Clear-Region([System.Drawing.Graphics]$graphics, [System.Drawing.Bitmap]$source, [System.Drawing.Rectangle]$rect, [int]$sampleX) {
  # Stretch a clean nearby parchment strip across the removed artwork. This
  # preserves the original vertical shading while avoiding tiled patterns.
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawImage($source, $rect, $sampleX, $rect.Y, 24, $rect.Height, [System.Drawing.GraphicsUnit]::Pixel)
}

$source = New-Object System.Drawing.Bitmap($sourcePath)
$clean = New-Object System.Drawing.Bitmap($source.Width, $source.Height)
$graphics = [System.Drawing.Graphics]::FromImage($clean)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImageUnscaled($source,0,0)

# Completely remove just the two printed rails, fixed flowers, and static
# percentages. The surrounding parchment is sampled from the supplied art;
# the live rails and values are composited by the web page as independent controls.
Clear-Region $graphics $source (New-Object System.Drawing.Rectangle(244,340,578,92)) 820
Clear-Region $graphics $source (New-Object System.Drawing.Rectangle(838,344,118,70)) 822
Clear-Region $graphics $source (New-Object System.Drawing.Rectangle(244,688,578,82)) 225
Clear-Region $graphics $source (New-Object System.Drawing.Rectangle(825,695,140,70)) 822

$graphics.Dispose()
$clean.Save((Join-Path $outputDir 'settings-popup-sliderless.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$clean.Dispose()

# A slim, single gold rail. It is an image asset rather than a browser range track.
$rail = New-Object System.Drawing.Bitmap 568,28
$railGraphics = [System.Drawing.Graphics]::FromImage($rail)
$railGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$railGraphics.Clear([System.Drawing.Color]::Transparent)
$outer = New-Object System.Drawing.RectangleF 1,2,566,24
$outerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($outer,[System.Drawing.Color]::FromArgb(147,85,25),[System.Drawing.Color]::FromArgb(236,181,61),[System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(1,2,24,24,90,180); $path.AddArc(543,2,24,24,270,180); $path.CloseFigure()
$railGraphics.FillPath($outerBrush,$path)
$inner = New-Object System.Drawing.Drawing2D.GraphicsPath
$inner.AddArc(5,6,16,16,90,180); $inner.AddArc(547,6,16,16,270,180); $inner.CloseFigure()
$innerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.RectangleF(5,6,558,16)),[System.Drawing.Color]::FromArgb(255,218,107),[System.Drawing.Color]::FromArgb(233,165,39),[System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$railGraphics.FillPath($innerBrush,$inner)
$highlight = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,244,173),1.4)
$railGraphics.DrawPath($highlight,$inner)
$highlight.Dispose(); $innerBrush.Dispose(); $inner.Dispose(); $path.Dispose(); $outerBrush.Dispose(); $railGraphics.Dispose()
$rail.Save((Join-Path $outputDir 'settings-slider-rail.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$rail.Dispose()

# The real handle is the supplied gold flower, clipped to its own circular
# silhouette so no square parchment/background from the source image remains.
$flower = New-Object System.Drawing.Bitmap 62,62
$flowerGraphics = [System.Drawing.Graphics]::FromImage($flower)
$flowerGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$flowerGraphics.DrawImage($source, (New-Object System.Drawing.Rectangle(0,0,62,62)), 478,352,62,62, [System.Drawing.GraphicsUnit]::Pixel)
$flowerGraphics.Dispose()
for ($y = 0; $y -lt 62; $y++) {
  for ($x = 0; $x -lt 62; $x++) {
    $dx = $x - 30.5; $dy = $y - 30.5
    if (($dx * $dx + $dy * $dy) -gt 30.5 * 30.5) {
      $pixel = $flower.GetPixel($x,$y)
      $flower.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(0,$pixel.R,$pixel.G,$pixel.B))
    }
  }
}
$flower.Save((Join-Path $outputDir 'settings-slider-flower.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$flower.Dispose()

# The original switch is similarly extracted as one opaque art layer so the
# visible state can change without adding a second drawn control on top.
$switchArt = New-Object System.Drawing.Bitmap 144,86
$switchGraphics = [System.Drawing.Graphics]::FromImage($switchArt)
$switchGraphics.DrawImage($source, (New-Object System.Drawing.Rectangle(0,0,144,86)), 820,492,144,86, [System.Drawing.GraphicsUnit]::Pixel)
$switchGraphics.Dispose()
$switchArt.Save((Join-Path $outputDir 'settings-sfx-switch-on.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$switchArt.Dispose(); $source.Dispose()
