# 批量生成球面画廊的照片（DomeGallery 用）
# 用法: pwsh -File tools/gen-dome-photos.ps1 -Count 8
param(
  [int]$Count = 8,
  [string]$Api = "http://127.0.0.1:8188",
  [string]$Ckpt = "Realistic_Vision_V6.safetensors"
)

$ErrorActionPreference = "Stop"

# 负向提示词：除质量词外，专门锁死"负面情绪"这一类
$neg = "sad, gloomy, rain, storm, dark mood, melancholy, crying, tears, lonely, alone, sorrow, funeral, mourning, empty, cold blue, horror, scary, blood, cartoon, anime, 3d render, cgi, illustration, painting, oversaturated, hdr, plastic skin, doll, watermark, text, signature, logo, blurry, lowres, jpeg artifacts, deformed, bad anatomy, bad hands, extra fingers, extra limbs, disfigured, worst quality, low quality"

# 固定风格后缀：所有图共用，保证球面上 40 张风格统一
$style = ", cinematic wedding photography, documentary style, film grain, 35mm, shallow depth of field, warm golden tones, soft natural light, professional photography, elegant, romantic, joyful, tender, high quality, detailed"

# 场景列表：情绪全部正向，只变化主体/场景/构图
$scenes = @(
  @{ n = '01-forest-bride';    p = 'a joyful bride in a sunlit forest, backlit by golden hour light, gentle happy smile, elegant wedding dress, beautiful bokeh, warm sunlight filtering through green leaves' },
  @{ n = '02-church-ceremony'; p = 'a warm wedding ceremony inside a candlelit church, the couple holding hands and smiling at each other, soft candlelight, stained glass windows, peaceful and elegant atmosphere' },
  @{ n = '03-old-town-walk';   p = 'a happy young couple walking hand in hand in an old town street, candid laughing moment, looking at each other with affection, natural daylight, charming architecture in the background' },
  @{ n = '04-bouquet-detail';  p = 'close-up of a bride holding a delicate bouquet of white and blush flowers, soft natural light, shallow depth of field, bright and airy, elegant and fresh' },
  @{ n = '05-rings-moment';    p = 'close-up of two hands gently exchanging wedding rings, tender and warm moment, elegant golden tones, soft diffused light, intimate and full of love' },
  @{ n = '06-beach-sunset';    p = 'a newlywed couple embracing and laughing together on a beach at golden sunset, warm orange sky, romantic and joyful, cinematic wide shot, ocean waves softly blurred' },
  @{ n = '07-window-portrait'; p = 'a serene portrait of a woman standing beside a large window, soft natural light on her face, gentle warm smile, elegant styling, film grain, shallow depth of field' },
  @{ n = '08-petal-celebration'; p = 'wedding guests joyfully throwing flower petals over the happy couple, celebration moment, confetti in the air, warm afternoon light, candid and full of laughter, festive atmosphere' }
)

$total = [Math]::Min($Count, $scenes.Count)
Write-Output "开始生成 $total 张，模型 = $Ckpt"
Write-Output "（负向提示词已锁死 sad/gloomy/rain/lonely 等负面情绪词）"
Write-Output ""

$ok = 0
for ($i = 0; $i -lt $total; $i++) {
  $s = $scenes[$i]
  $wf = @{
    "4" = @{ class_type = "CheckpointLoaderSimple"; inputs = @{ ckpt_name = $Ckpt } }
    "5" = @{ class_type = "EmptyLatentImage"; inputs = @{ width = 768; height = 1024; batch_size = 1 } }
    "6" = @{ class_type = "CLIPTextEncode"; inputs = @{ text = ($s.p + $style); clip = @("4", 1) } }
    "7" = @{ class_type = "CLIPTextEncode"; inputs = @{ text = $neg; clip = @("4", 1) } }
    "3" = @{ class_type = "KSampler"; inputs = @{
        seed = (Get-Random -Minimum 1 -Maximum 999999999)
        steps = 28; cfg = 5.5; sampler_name = "dpmpp_2m"; scheduler = "karras"; denoise = 1.0
        model = @("4", 0); positive = @("6", 0); negative = @("7", 0); latent_image = @("5", 0)
      } }
    "8" = @{ class_type = "VAEDecode"; inputs = @{ samples = @("3", 0); vae = @("4", 2) } }
    "9" = @{ class_type = "SaveImage"; inputs = @{ filename_prefix = ("dome/" + $s.n); images = @("8", 0) } }
  }

  $body = @{ prompt = $wf; client_id = "dsh-dome" } | ConvertTo-Json -Depth 12 -Compress
  try {
    $r = Invoke-RestMethod -Uri "$Api/prompt" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
  } catch {
    Write-Output ("[{0}] ❌ 提交失败: {1}" -f $s.n, $_.Exception.Message)
    continue
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $done = $false
  while ($sw.Elapsed.TotalSeconds -lt 180) {
    Start-Sleep -Milliseconds 1500
    try {
      $h = Invoke-RestMethod -Uri "$Api/history/$($r.prompt_id)" -TimeoutSec 15
      if ($h.$($r.prompt_id).outputs) { $done = $true; break }
    } catch { }
  }
  $sw.Stop()
  if ($done) { $ok++; Write-Output ("[{0}] ✅ 完成  {1:N1}s" -f $s.n, $sw.Elapsed.TotalSeconds) }
  else { Write-Output ("[{0}] ⚠️ 超时或未返回结果" -f $s.n) }
}

Write-Output ""
Write-Output "完成 $ok / $total 张"
