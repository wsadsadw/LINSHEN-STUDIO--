<#
  build-assets.ps1
  ------------------------------------------------------------------
  Turn original photos in .\photos\ into the optimized files the site
  actually loads, and render the hero background video.

  Outputs
    public\images\about-portrait.jpg  1200x1500   about section portrait (4:5)
    public\images\work-01.jpg         1900x1280   wide work card
    public\images\work-02.jpg         1300x1240   narrow work card
    public\images\work-03.jpg         1300x1240   narrow work card
    public\images\work-04.jpg         1900x1280   wide work card
    public\media\hero.mp4             1920x1080   seamless 11s neon-graded loop
    public\images\hero-poster.jpg     first frame of hero.mp4 (so poster and video match exactly)

  The hero video is NOT a plain ken-burns. It is a three-layer grade built from
  photos\hero.jpg: a darkened base, a heavily blurred "bloom" pass tinted toward
  the neon palette, and a screen blend of the two. That is what makes the lights
  glow like neon instead of just looking like a tinted photo. The zoom follows
  sin() so the 11s loop has no visible seam.

  Requires ffmpeg on PATH, or pass -Ffmpeg "C:\path\to\ffmpeg.exe".

  Usage:
    powershell -ExecutionPolicy Bypass -File tools\build-assets.ps1
    powershell -ExecutionPolicy Bypass -File tools\build-assets.ps1 -HeroPalette amber
#>
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\photos'),
  [string]$Out    = (Join-Path $PSScriptRoot '..\public'),
  [string]$Ffmpeg = 'ffmpeg',
  # neon  = magenta + cyan  (classic neon-sign look)
  # amber = warm gold + teal (matches the site's bronze accent)
  [ValidateSet('neon', 'amber')]
  [string]$HeroPalette = 'neon'
)

$ErrorActionPreference = 'Stop'
$Source = (Resolve-Path $Source).Path

$imgDir = Join-Path $Out 'images'
$vidDir = Join-Path $Out 'media'
New-Item -ItemType Directory -Force -Path $imgDir, $vidDir | Out-Null

# name, source file, target width, target height, vertical crop bias (0 = keep top, 1 = keep bottom), jpeg quality
$jobs = @(
  @{ out = 'about-portrait.jpg'; src = 'portrait-01.jpg'; w = 1200; h = 1500; bias = 0.26; q = 4 },
  @{ out = 'work-01.jpg';        src = 'wedding-01.jpg';  w = 1900; h = 1280; bias = 0.5;  q = 4 },
  @{ out = 'work-02.jpg';        src = 'wedding-02.jpg';  w = 1300; h = 1240; bias = 0.22; q = 4 },
  @{ out = 'work-03.jpg';        src = 'wedding-03.jpg';  w = 1300; h = 1240; bias = 0.22; q = 4 },
  @{ out = 'work-04.jpg';        src = 'wedding-04.jpg';  w = 1900; h = 1280; bias = 0.5;  q = 4 }
)

foreach ($j in $jobs) {
  $in = Join-Path $Source $j.src
  if (-not (Test-Path $in)) { Write-Warning "skip $($j.out): missing $in"; continue }

  $filter = "scale=$($j.w):$($j.h):force_original_aspect_ratio=increase," +
            "crop=$($j.w):$($j.h):(iw-$($j.w))/2:(ih-$($j.h))*$($j.bias),unsharp=5:5:0.35"
  $target = Join-Path $imgDir $j.out

  & $Ffmpeg -y -hide_banner -loglevel error -i $in -vf $filter -q:v $j.q -pix_fmt yuvj420p $target
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed on $($j.out)" }

  $kb = [math]::Round((Get-Item $target).Length / 1KB)
  Write-Host ("  {0,-20} {1,5}x{2,-5} {3,5} KB" -f $j.out, $j.w, $j.h, $kb)
}

# ---- hero video: neon-graded, seamless zoom loop ----
$heroSrc = Join-Path $Source 'hero.jpg'
if (Test-Path $heroSrc) {
  $sec    = 11
  $fps    = 30
  $frames = $sec * $fps
  $mp4    = Join-Path $vidDir 'hero.mp4'
  $poster = Join-Path $imgDir 'hero-poster.jpg'

  # how far the blurred bloom pass is pushed toward the neon palette
  if ($HeroPalette -eq 'amber') {
    $cbGlow = 'rm=0.30:gm=0.12:bm=-0.10'   # warm gold bloom
    $cbBase = 'rm=0.12:bm=0.06'            # slightly warm base
  } else {
    $cbGlow = 'rm=0.36:bm=0.42:gm=-0.14'   # magenta + cyan bloom
    $cbBase = 'rm=0.05:bm=0.14'            # cool base
  }

  # 三层霓虹调：
  #   1) base   压暗 + 高斯模糊 —— 把招牌文字糊成不认识的光块（避免画面里出现别的城市的地名）
  #   2) glow   重模糊 + 横向拉丝 + 朝霓虹色偏 —— 这是「霓虹感」的真正来源
  #   3) screen 把 glow 叠回 base —— 加色混合才有辉光，不是简单调个色
  $vf = "scale=2560:1440:force_original_aspect_ratio=increase," +
        "crop=2560:1440," +
        "zoompan=z='1+0.16*sin(PI*on/$frames)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=$fps," +
        "split=2[b][g];" +
        "[g]eq=saturation=2.2:brightness=0.12:contrast=1.15,gblur=sigma=44,avgblur=sizeX=72:sizeY=6," +
        "colorbalance=$cbGlow,format=gbrp[glow];" +
        "[b]eq=brightness=-0.36:contrast=1.2:saturation=1.5,gblur=sigma=15,colorbalance=$cbBase,format=gbrp[bg];" +
        "[bg][glow]blend=all_mode=screen:all_opacity=0.88,format=yuv420p," +
        "hue=h='12*sin(2*PI*t/$sec)'," +
        "noise=alls=7:allf=t+u,vignette=PI/4.2"

  & $Ffmpeg -y -hide_banner -loglevel error -loop 1 -i $heroSrc -filter_complex $vf -t $sec -an `
    -c:v libx264 -preset slow -crf 24 -movflags +faststart -r $fps -pix_fmt yuv420p $mp4
  if ($LASTEXITCODE -ne 0) { throw 'ffmpeg failed on hero.mp4' }

  # poster = the video's own first frame, so there is no jump when the video starts
  & $Ffmpeg -y -hide_banner -loglevel error -i $mp4 -frames:v 1 -q:v 5 $poster
  if ($LASTEXITCODE -ne 0) { throw 'ffmpeg failed on hero-poster.jpg' }

  Write-Host ("  {0,-20} {1,5}x{2,-5} {3,5} MB  ({4})" -f 'hero.mp4', 1920, 1080,
    [math]::Round((Get-Item $mp4).Length / 1MB, 2), $HeroPalette)
  Write-Host ("  {0,-20} {1,5}x{2,-5} {3,5} KB" -f 'hero-poster.jpg', 1920, 1080,
    [math]::Round((Get-Item $poster).Length / 1KB))
}

Write-Host 'done.'
