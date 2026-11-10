/**
 * 把 ComfyUI 生成的 PNG 转成网站用的 WebP，放进 public/images/dome/。
 *
 * 为什么要转换：
 *   1. ComfyUI 输出是 768×1024 的 PNG，每张约 1 MB —— 40 张就是 40 MB，绝不能直接上站。
 *   2. DomeGallery 用普通 <img src> 渲染所有格子，没有懒加载，
 *      首次进入就会请求全部 40 张。所以单张必须压到几十 KB。
 *   3. 球面格子实际显示尺寸很小，512×683 足够；点开放大时会略软，这是可接受的取舍。
 *
 * 用法: node tools/convert-dome-photos.mjs
 */
import { execFile } from 'node:child_process';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const SRC_DIR = 'D:\\dsh-env\\ComfyUI-master\\output\\dome';
const OUT_DIR = path.join(PROJECT, 'public', 'images', 'dome');
const FFMPEG = 'E:\\deepcode\\tools\\ffmpeg-bin\\ffmpeg.exe';

const WIDTH = 512;
const HEIGHT = 683; // 保持 3:4
const QUALITY = 85;

await mkdir(OUT_DIR, { recursive: true });

const all = await readdir(SRC_DIR);
const pngs = all.filter((f) => f.endsWith('.png')).sort();

if (!pngs.length) {
  console.error('没有找到任何 PNG，请先跑 gen-dome-photos.mjs');
  process.exit(1);
}

/**
 * 必须按场景名精确匹配，不能图省事直接遍历目录。
 *
 * 原因：ComfyUI 的 SaveImage 遇到同名文件会自动递增编号（_00001_ → _00002_）。
 * 我第一次只生成了 8 个场景，第二次扩展到 40 个场景时，
 * 01-forest-bride / 02-church-ceremony 这类重名场景产生了 _00002_，
 * 而旧场景（如 05-rings-moment、03-old-town-walk）的遗留文件也还在目录里，
 * 外加一张流程测试的 test_00001_.png —— 直接遍历会混进 49 张。
 */
const TARGETS = [
  '01-forest-bride', '02-church-ceremony', '03-rings-moment', '04-petal-celebration',
  '05-lawn-vows', '06-first-kiss', '07-cake-cutting', '08-first-dance',
  '09-bouquet-toss', '10-vow-reading', '11-window-portrait', '12-bride-solo',
  '13-groom-solo', '14-couple-gaze', '15-elder-couple', '16-parent-child',
  '17-bridesmaids', '18-profile-silhouette', '19-looking-back', '20-embrace-closeup',
  '21-laughing-moment', '22-veil-portrait', '23-bouquet-detail', '24-ring-detail',
  '25-dress-detail', '26-invitation-flatlay', '27-shoes-detail', '28-father-daughter',
  '29-mirror-makeup', '30-champagne-tower', '31-old-town-walk', '32-beach-sunset',
  '33-wheat-field', '34-garden-greenhouse', '35-lakeside-boardwalk', '36-hilltop-sunset',
  '37-old-house-porch', '38-rooftop-evening', '39-cafe-corner', '40-library-loft'
];

console.log(`目标场景 ${TARGETS.length} 个，开始转换 -> ${OUT_DIR}`);
console.log(`目标: ${WIDTH}x${HEIGHT} WebP q${QUALITY}`);
console.log('');

const manifest = [];
let totalOut = 0;
let missing = 0;

for (let i = 0; i < TARGETS.length; i++) {
  const scene = TARGETS[i];
  // 精确匹配「场景名_编号_.png」，取编号最大的一张（即该场景最新生成的）
  const matches = pngs.filter((f) => f.startsWith(scene + '_')).sort();
  if (!matches.length) {
    console.error(`  [${String(i + 1).padStart(2, '0')}] ❌ 缺少场景 ${scene}`);
    missing++;
    continue;
  }
  const src = path.join(SRC_DIR, matches[matches.length - 1]);
  const idx = String(i + 1).padStart(2, '0');
  const name = `dome-${idx}.webp`;
  const out = path.join(OUT_DIR, name);

  try {
    await run(FFMPEG, [
      '-y', '-loglevel', 'error',
      '-i', src,
      '-vf', `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
      '-c:v', 'libwebp',
      '-quality', String(QUALITY),
      '-compression_level', '6',
      out
    ]);
    const st = await stat(out);
    totalOut += st.size;
    manifest.push({ file: name, kb: Math.round(st.size / 1024), from: path.basename(src) });
    console.log(`  [${idx}] ${name}  ${String(Math.round(st.size / 1024)).padStart(3)} KB   (${path.basename(src)})`);
  } catch (e) {
    console.error(`  [${idx}] ❌ 转换失败 ${src}: ${e.message}`);
  }
}

console.log('');
console.log(`完成 ${manifest.length} / ${TARGETS.length} 张，合计 ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
if (missing) console.log(`⚠️ 有 ${missing} 个场景没找到源文件`);

// 写出清单，供生成 gallery 数据时使用
await writeFile(
  path.join(__dirname, 'dome-manifest.json'),
  JSON.stringify({ count: manifest.length, totalMB: +(totalOut / 1024 / 1024).toFixed(2), files: manifest }, null, 2),
  'utf8'
);
console.log(`清单已写入 tools/dome-manifest.json`);
