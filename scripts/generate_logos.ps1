Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\naiti\.gemini\antigravity\brain\93afa014-27ef-4d7c-b584-6084ec313363\.user_uploaded\media_1793813915531_0ee0b71d.jpg"
$img = [System.Drawing.Image]::FromFile($sourcePath)

Write-Host "Source dimensions: $($img.Width) x $($img.Height)"

# 1. Save main official logo to public/assets/visroslot-logo.png (Full 1024x1024 PNG)
$destPath = "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\assets\visroslot-logo.png"
$fullBmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($fullBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$g.Dispose()

$fullBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved full logo to $destPath ($((Get-Item $destPath).Length) bytes)"

# Also save alias
$destPathAlias = "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\assets\visroslot-logo-full.png"
$fullBmp.Save($destPathAlias, [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Generate Favicon (32x32), Apple Touch Icon (180x180), PWA Icons (192x192, 512x512)
function Save-Resized($bmpIn, $targetSize, $outPath) {
    $outBmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g2 = [System.Drawing.Graphics]::FromImage($outBmp)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g2.DrawImage($bmpIn, 0, 0, $targetSize, $targetSize)
    $g2.Dispose()
    $outBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
    Write-Host "Saved $outPath ($targetSize x $targetSize)"
}

Save-Resized $fullBmp 32 "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\favicon.png"
Save-Resized $fullBmp 180 "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\apple-touch-icon.png"
Save-Resized $fullBmp 192 "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\icon-192.png"
Save-Resized $fullBmp 512 "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\icon-512.png"

# Also save .ico (Windows icon format)
# Using 48x48 bitmap converted to icon handle
$icoBmp = New-Object System.Drawing.Bitmap(48, 48)
$gIco = [System.Drawing.Graphics]::FromImage($icoBmp)
$gIco.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIco.DrawImage($fullBmp, 0, 0, 48, 48)
$gIco.Dispose()
$hIcon = $icoBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream("C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\favicon.ico", [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icoBmp.Dispose()
Write-Host "Saved favicon.ico"

# 3. Create Emblem Crop for Compact Usage & Favicon clarity
# The emblem (inner circular crest with peacock feather, flute, calendar) is centered vertically and horizontally in upper-middle
# Let's also save an emblem-only version:
$emblemCrop = New-Object System.Drawing.Bitmap(680, 680)
$gEmb = [System.Drawing.Graphics]::FromImage($emblemCrop)
$gEmb.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gEmb.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
# Upper center crop (around peacock feather and calendar)
$gEmb.DrawImage($fullBmp, [System.Drawing.Rectangle]::new(0, 0, 680, 680), [System.Drawing.Rectangle]::new(172, 60, 680, 680), [System.Drawing.GraphicsUnit]::Pixel)
$gEmb.Dispose()
$emblemPath = "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\assets\visroslot-emblem.png"
$emblemCrop.Save($emblemPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved visroslot-emblem.png"

# 4. Create Compact Derived Logo (Horizontal layout with circular emblem + official wordmark)
# Standard compact navbar size: 360 x 96 (aspect ratio 3.75:1)
$compactBmp = New-Object System.Drawing.Bitmap(420, 110)
$gComp = [System.Drawing.Graphics]::FromImage($compactBmp)
$gComp.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gComp.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gComp.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gComp.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$gComp.Clear([System.Drawing.Color]::FromArgb(16, 26, 43)) # #101A2B Navy background

# Draw circular emblem on left (96x96 with margin)
$gComp.DrawImage($fullBmp, [System.Drawing.Rectangle]::new(8, 7, 96, 96), [System.Drawing.Rectangle]::new(0, 0, $fullBmp.Width, $fullBmp.Height), [System.Drawing.GraphicsUnit]::Pixel)

# Draw VISROSLOT wordmark from the source logo
# In the original 1024x1024, "VISROSLOT" wordmark is located between Y: 590 and Y: 730, X: 110 to 914
$wordmarkRect = [System.Drawing.Rectangle]::new(110, 595, 804, 135)
$gComp.DrawImage($fullBmp, [System.Drawing.Rectangle]::new(114, 18, 290, 48), $wordmarkRect, [System.Drawing.GraphicsUnit]::Pixel)

# Draw Tagline "EVERY SLOT. SIMPLIFIED."
# In the original, tagline is located between Y: 720 and Y: 810
$taglineRect = [System.Drawing.Rectangle]::new(140, 725, 744, 90)
$gComp.DrawImage($fullBmp, [System.Drawing.Rectangle]::new(118, 68, 280, 32), $taglineRect, [System.Drawing.GraphicsUnit]::Pixel)

$gComp.Dispose()
$compactPath = "C:\Users\naiti\Downloads\stitch_restaurant_qr_saas_platform\public\assets\visroslot-logo-compact.png"
$compactBmp.Save($compactPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved visroslot-logo-compact.png"

$fullBmp.Dispose()
$img.Dispose()
Write-Host "All logo assets generated successfully!"
