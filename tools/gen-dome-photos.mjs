/**
 * 批量生成球面画廊（DomeGallery）用的照片。
 *
 * 为什么用 Node 而不是 PowerShell：
 * 本机是 Windows PowerShell 5.1，它把 UTF-8 无 BOM 的 .ps1 按 GBK 解析，
 * 脚本里的中文注释会让整个文件解析失败（变量名会被吃掉）。
 * Node 没有这个问题，而且 ComfyUI 的 API 本来就是 JSON。
 *
 * 用法: node tools/gen-dome-photos.mjs [数量]
 */
import { writeFile } from 'node:fs/promises';

const API = 'http://127.0.0.1:8188';
const CKPT = 'Realistic_Vision_V6.safetensors';
const COUNT = Number(process.argv[2] || 8);

// 负向提示词：除了常规质量词，专门锁死「负面情绪」这一类
const NEGATIVE = [
  'sad', 'gloomy', 'rain', 'storm', 'dark mood', 'melancholy', 'crying', 'tears',
  'lonely', 'alone', 'sorrow', 'funeral', 'mourning', 'empty', 'cold blue',
  'horror', 'scary', 'blood',
  'cartoon', 'anime', '3d render', 'cgi', 'illustration', 'painting',
  'oversaturated', 'hdr', 'plastic skin', 'doll',
  'watermark', 'text', 'signature', 'logo',
  'blurry', 'lowres', 'jpeg artifacts',
  'deformed', 'bad anatomy', 'bad hands', 'extra fingers', 'extra limbs', 'disfigured',
  'worst quality', 'low quality'
].join(', ');

// 固定风格后缀：所有图共用，保证球面上风格统一
const STYLE = ', cinematic wedding photography, documentary style, film grain, 35mm, shallow depth of field, warm golden tones, soft natural light, professional photography, elegant, romantic, joyful, tender, high quality, detailed';

// 场景：情绪全部正向，只变化主体 / 场景 / 构图
// 40 个不同场景 —— 与 segments=8 生成的 40 个格子一一对应，做到一张不重复
const SCENES = [
  // ── 婚礼仪式 ──
  { n: '01-forest-bride', p: 'a joyful bride in a sunlit forest, backlit by golden hour light, gentle happy smile, elegant wedding dress, beautiful bokeh, warm sunlight filtering through green leaves' },
  { n: '02-church-ceremony', p: 'a warm wedding ceremony inside a candlelit church, the couple holding hands and smiling at each other, soft candlelight, stained glass windows, peaceful and elegant atmosphere' },
  { n: '03-rings-moment', p: 'close-up of two hands gently exchanging wedding rings, tender and warm moment, elegant golden tones, soft diffused light, intimate and full of love' },
  { n: '04-petal-celebration', p: 'wedding guests joyfully throwing flower petals over the happy couple, celebration moment, confetti in the air, warm afternoon light, candid and full of laughter' },
  { n: '05-lawn-vows', p: 'an outdoor lawn wedding ceremony, the couple reading their vows to each other, soft late afternoon sun, green garden setting, gentle smiles, white chairs arranged in rows' },
  { n: '06-first-kiss', p: 'the newlywed couple sharing their first kiss at the altar, warm golden light, guests softly blurred in the background, romantic and emotional, cinematic moment' },
  { n: '07-cake-cutting', p: 'the happy couple cutting their wedding cake together, laughing warmly, elegant table setting, soft warm interior light, joyful celebration' },
  { n: '08-first-dance', p: 'the bride and groom sharing their first dance, warm string lights overhead, gentle motion blur, romantic and intimate, soft golden glow' },
  { n: '09-bouquet-toss', p: 'the bride joyfully tossing her bouquet, friends cheering with raised hands, bright happy moment, warm afternoon light, candid celebration' },
  { n: '10-vow-reading', p: 'a tender moment during the vow exchange, the bride holding a handwritten letter, soft natural light, warm tones, emotional but joyful' },

  // ── 人像 ──
  { n: '11-window-portrait', p: 'a serene portrait of a woman standing beside a large window, soft natural light on her face, gentle warm smile, elegant styling, film grain, shallow depth of field' },
  { n: '12-bride-solo', p: 'an elegant portrait of a bride alone, soft side light, delicate veil, calm and radiant expression, warm neutral background, timeless and graceful' },
  { n: '13-groom-solo', p: 'a confident portrait of a groom in a tailored suit, warm side lighting, relaxed natural smile, soft dark background, refined and modern' },
  { n: '14-couple-gaze', p: 'a close portrait of a couple looking into each others eyes and smiling, intimate and warm, soft window light, shallow depth of field, romantic and tender' },
  { n: '15-elder-couple', p: 'an elderly couple holding hands and smiling warmly at each other, gentle wrinkles of a long life together, soft natural light, deeply heartwarming and dignified' },
  { n: '16-parent-child', p: 'a parent gently lifting a laughing child into the air, warm afternoon sun, candid family moment, soft green background, pure joy' },
  { n: '17-bridesmaids', p: 'a group of bridesmaids laughing together in matching elegant dresses, warm natural light, candid friendship moment, soft garden backdrop' },
  { n: '18-profile-silhouette', p: 'an elegant side profile portrait, soft rim light outlining the face, warm dark background, graceful neck line, artistic and refined' },
  { n: '19-looking-back', p: 'a woman glancing back over her shoulder with a gentle smile, soft golden light, delicate hair detail, warm blurred background, spontaneous and charming' },
  { n: '20-embrace-closeup', p: 'a close-up of a couple embracing, heads resting together, eyes closed with peaceful smiles, soft warm light, deeply affectionate' },
  { n: '21-laughing-moment', p: 'a spontaneous portrait of a person laughing openly, head tilted back slightly, warm natural light, genuine happiness, soft background' },
  { n: '22-veil-portrait', p: 'a portrait through a translucent wedding veil, soft diffused light, delicate lace texture, dreamy and elegant, warm tones' },

  // ── 细节与场景元素 ──
  { n: '23-bouquet-detail', p: 'close-up of a bride holding a delicate bouquet of white and blush flowers, soft natural light, shallow depth of field, bright and airy, elegant and fresh' },
  { n: '24-ring-detail', p: 'an elegant macro shot of wedding rings resting on soft fabric, warm golden light, shallow depth of field, refined and timeless' },
  { n: '25-dress-detail', p: 'a close detail of an elegant wedding dress, delicate lace and fabric texture, soft window light, warm neutral tones, refined craftsmanship' },
  { n: '26-invitation-flatlay', p: 'an elegant flat lay of wedding invitations, dried flowers and a wax seal on a linen surface, soft natural light, warm neutral palette, tasteful styling' },
  { n: '27-shoes-detail', p: 'a delicate pair of wedding shoes arranged on a soft rug, gentle window light, warm tones, elegant and refined detail shot' },
  { n: '28-father-daughter', p: 'a father walking his daughter down the aisle, both smiling softly, warm light from the side, emotional but joyful, elegant setting' },
  { n: '29-mirror-makeup', p: 'a bride getting ready in front of a softly lit mirror, warm morning light, calm and happy expression, elegant interior, quiet anticipation' },
  { n: '30-champagne-tower', p: 'a champagne tower being poured at a warm evening celebration, golden sparkle, soft bokeh lights, festive and elegant' },

  // ── 场景与环境 ──
  { n: '31-old-town-walk', p: 'a happy young couple walking hand in hand in an old town street, candid laughing moment, looking at each other with affection, natural daylight, charming architecture behind' },
  { n: '32-beach-sunset', p: 'a newlywed couple embracing and laughing together on a beach at golden sunset, warm orange sky, romantic and joyful, cinematic wide shot, ocean waves softly blurred' },
  { n: '33-wheat-field', p: 'a couple walking through a golden wheat field at sunset, warm amber light, gentle breeze in the crops, romantic and peaceful, wide cinematic shot' },
  { n: '34-garden-greenhouse', p: 'an elegant portrait inside a bright glass greenhouse, soft diffused daylight through the glass roof, lush green plants around, warm and airy atmosphere' },
  { n: '35-lakeside-boardwalk', p: 'a couple strolling along a wooden lakeside boardwalk in late afternoon light, calm water reflection, warm tones, peaceful and romantic' },
  { n: '36-hilltop-sunset', p: 'a couple standing together on a hilltop at warm sunset, wide open sky, soft golden light wrapping around them, serene and expansive' },
  { n: '37-old-house-porch', p: 'a warm family moment on an old house porch, soft late afternoon light, wooden details, relaxed and genuine, homely atmosphere' },
  { n: '38-rooftop-evening', p: 'a couple sharing a quiet moment on a rooftop at dusk, warm city lights beginning to glow, soft blue hour light with warm accents, cinematic' },
  { n: '39-cafe-corner', p: 'a relaxed portrait in a cozy cafe corner, warm interior lighting, soft window light, calm happy expression, inviting atmosphere' },
  { n: '40-library-loft', p: 'an elegant portrait in a warm library loft, tall wooden shelves, soft window light, refined and intellectual atmosphere, warm tones' }
];

function buildWorkflow(scene, seed) {
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: 768, height: 1024, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: scene.p + STYLE, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: NEGATIVE, clip: ['4', 1] } },
    3: {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps: 28,
        cfg: 5.5,
        sampler_name: 'dpmpp_2m',
        scheduler: 'karras',
        denoise: 1.0,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0]
      }
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: 'dome/' + scene.n, images: ['8', 0] } }
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submit(wf) {
  const res = await fetch(`${API}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: wf, client_id: 'dsh-dome' })
  });
  if (!res.ok) throw new Error(`submit ${res.status}: ${await res.text()}`);
  return (await res.json()).prompt_id;
}

async function waitFor(promptId, timeoutMs = 240000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    await sleep(1500);
    try {
      const res = await fetch(`${API}/history/${promptId}`);
      const h = await res.json();
      const entry = h[promptId];
      if (entry && entry.outputs && Object.keys(entry.outputs).length) {
        return { ok: true, secs: (Date.now() - t0) / 1000 };
      }
      if (entry && entry.status && entry.status.status_str === 'error') {
        return { ok: false, secs: (Date.now() - t0) / 1000, err: 'execution error' };
      }
    } catch {
      /* 轮询失败就重试 */
    }
  }
  return { ok: false, secs: (Date.now() - t0) / 1000, err: 'timeout' };
}

console.log(`== DomeGallery photo generation ==`);
console.log(`model: ${CKPT}  size: 768x1024  count: ${Math.min(COUNT, SCENES.length)}`);
console.log(`negative prompt locks out: sad / gloomy / rain / lonely / melancholy ...`);
console.log('');

let ok = 0;
const total = Math.min(COUNT, SCENES.length);
for (let i = 0; i < total; i++) {
  const scene = SCENES[i];
  const seed = Math.floor(Math.random() * 999999999) + 1;
  try {
    const id = await submit(buildWorkflow(scene, seed));
    const r = await waitFor(id);
    if (r.ok) {
      ok++;
      console.log(`[${scene.n}] OK   ${r.secs.toFixed(1)}s  seed=${seed}`);
    } else {
      console.log(`[${scene.n}] FAIL ${r.err} (${r.secs.toFixed(1)}s)`);
    }
  } catch (e) {
    console.log(`[${scene.n}] ERROR ${e.message}`);
  }
}

console.log('');
console.log(`done: ${ok} / ${total}`);

// 把结果清单写到文件，方便后续生成 gallery 数据
await writeFile(
  new URL('./dome-generated.json', import.meta.url),
  JSON.stringify({ generated: ok, total, scenes: SCENES.slice(0, total).map((s) => s.n) }, null, 2),
  'utf8'
);
