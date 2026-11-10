/**
 * ══════════════════════════════════════════════════════════════
 *  全站内容总入口
 *  改这一个文件，就能替换整站文案、联系方式、数据与作品。
 *  ⚠️ 凡是写「示例」的地方都是占位信息，上线前请全部换成你自己的。
 * ══════════════════════════════════════════════════════════════
 */

/* ── 导航 ───────────────────────────────────────────────── */
export const navLinks = [
  { id: 'top', label: '首页', en: 'INDEX' },
  { id: 'series', label: '拍摄系列', en: 'SERIES' },
  { id: 'works', label: '精选项目', en: 'WORK' },
  { id: 'strengths', label: '个人优势', en: 'EDGE' },
  { id: 'services', label: '服务套餐', en: 'PACKAGES' },
  { id: 'booking', label: '预约', en: 'BOOKING' },
]

/* ── 品牌 ───────────────────────────────────────────────── */
export const brand = {
  /* 品牌名已统一为 LINSHEN.STUDIO。
     此前首屏写 LINSHEN.STUDIO、导航和页脚写「林深影像」，同一屏两个名字。
     导航是两行结构（Nav.jsx 的 <b> + <i>），所以：
       zh 槽位 → 品牌名本身（唯一的那个名字）
       en 槽位 → 副标题，写「是什么」而不是「叫什么名字」
     两行都写名字等于没统一，别再改回去。 */
  zh: 'LINSHEN.STUDIO',
  en: 'PHOTOGRAPHER · 人像 / 婚礼 / 商业',
  mark: 'L', // 导航左侧的字母徽标
  tagline: 'PHOTOGRAPHER · 人像 / 婚礼 / 商业',
}

/* ── 01 · 首屏 ──────────────────────────────────────────── */
export const hero = {
  eyebrow: '独立摄影师 · 现居南昌',
  titleLines: ['我拍的不是照片', '是时间'],
  latin: 'NOT PHOTOS. TIME ITSELF.',
  desc: '十二年，在婚礼现场、影棚与街头之间往返。用一台相机，替 860 多组家庭与品牌，保存那些再也回不去的瞬间。',
  primary: { label: '预约拍摄', href: '#booking' },
  secondary: { label: '查看作品', href: '#works' },
  ticker: ['婚礼纪实', '人像写真', '品牌视觉', '商业产品', '空间摄影', '家庭记录'],
  // 首屏右下角的「取景参数」——纯装饰，营造相机 HUD 的科技感
  hud: [
    { k: 'BODY', v: 'SONY α1' },
    { k: 'LENS', v: '35mm F1.4 GM' },
    { k: 'SHUTTER', v: '1/250s' },
    { k: 'APERTURE', v: 'F1.8' },
    { k: 'ISO', v: '400' },
  ],
}

/* ── 首屏（agency 海报式）的全部文案 ──────────────────────
   这些原来写死在 src/alt/AltStudio.jsx 里，改文案得钻进一个满是 3D 变换的
   组件文件里翻，很别扭。现在统一收到这里 —— 改首页文字只改这一段。
   视觉参数（线圈半径、粒子大小、盘几圈）仍然留在 AltStudio.jsx，
   那些属于「调设计」，不属于「改内容」。
   字符串里的 \n 表示换行。 */
export const studio = {
  editorial: {
    title: '光落下来，\n故事留下来。',
    viewWork: '浏览精选作品',
    chapterNav: '探索网站章节',
  },
  /** 粒子生成的大字标，也是这一屏的品牌名 */
  wordmark: 'LINSHEN.STUDIO',
  /** 给读屏软件和搜索引擎用的完整句子，视觉上看不见 */
  wordmarkAlt: 'LINSHEN.STUDIO — 婚礼纪实 · 人像写真 · 商业影像',
  /** 右上角小字 */
  meta: 'EST. 2014 / NANCHANG',
  /** 字标下方那行小字 */
  rule: 'PHOTOGRAPHY · 婚礼纪实 / 人像 / 商业',

  /** 左下：服务标题与简介 */
  services: {
    kicker: 'SERVICES / 拍摄服务',
    title: '婚礼纪实\n人像写真 · 商业影像',
    desc: '一台相机，跟完整场仪式。不摆拍、不喊口令，\n只管把你没注意到的那些瞬间留下来。',
    cta: '查看档期',
  },

  /** 首屏快速咨询表单的文案。
   *  ⚠️ 该表单已从首屏移除（首屏只立调性，转化交给底部预约板块），
   *  这组文案暂时没有消费者；保留是为了以后想加回表单时不用重写。 */
  form: {
    kicker: 'START A PROJECT',
    nameLabel: '称呼',
    namePlaceholder: '怎么称呼你',
    contactLabel: '联系',
    contactPlaceholder: '手机 / 微信',
    briefLabel: '需求',
    briefPlaceholder: '想拍什么、大概什么时候',
    // 提交后不再打开邮件客户端：内容会自动复制到剪贴板并弹出微信二维码
    submit: '微信咨询',
    sent: '已复制，扫码加我',
  },

  /** 邮箱保留：底部预约板块的联系渠道仍在用（首屏表单已改走微信） */
  email: '276238371@qq.com',
}

/* ── 首屏：环绕字标的一圈照片 ───────────────────────────── */
/**
 * 现在这 12 张是本机 ComfyUI（Realistic Vision V6）生成的 768×768 WebP，
 * 放在 public/images/reel/r-01..12.webp。
 *
 * 口径（三轮调整后的结果，别随手改回去）：
 *   1. 主题只取【细节 / 静物 / 场景 / 光影】，不含人物 —— 高端摄影站常用这种
 *      素材占线圈，比人像更耐看，也不会和「拍摄系列」里的人像卡片打架。
 *   2. 生成时就写「冷调（青灰/墨绿）+ 暖暗部」的描述词。
 *   3. 生成后统一过一遍后处理（分离调色 + 暗角 + 降饱和 + 压暗），
 *      让暗部烧进暖棕红、边缘收到近黑 —— 目的是和首屏那层橙红 radial
 *      渐变在明度上连成一片，图才不像「贴上去的」。脚本见
 *      tools/grade-reel.py，改动后重跑即可。
 *
 * ⚠️ 这些仍是 AI 生成的占位素材，不是你的真实作品。
 *    换成你自己的：同名覆盖 public/images/reel/r-01..12.webp，再改下面的 alt。
 * 数量随意：12 张这个环比较饱满，少于 8 张会显得稀稀拉拉。
 */
export const heroReel = [
  { src: '/images/reel/r-01.webp', alt: '婚礼细节：两枚婚戒静置于深色丝绒上，冷调金属反光' },
  { src: '/images/reel/r-02.webp', alt: '婚纱细节：白色蕾丝面料在冷光下的纹理与褶皱' },
  { src: '/images/reel/r-03.webp', alt: '静物：干花与尤加利叶手捧，置于深色石面' },
  { src: '/images/reel/r-04.webp', alt: '静物：亚光压印请柬与火漆印的平铺摆拍' },
  { src: '/images/reel/r-05.webp', alt: '场景：空教堂里的木质长椅与斜射进来的光柱' },
  { src: '/images/reel/r-06.webp', alt: '建筑细节：彩色玻璃窗透出的冷蓝光落在石墙上' },
  { src: '/images/reel/r-07.webp', alt: '静物：暗色宴会厅里的香槟塔，银光与烛光交叠' },
  { src: '/images/reel/r-08.webp', alt: '静物：深色毛毯上的一双象牙色婚鞋' },
  { src: '/images/reel/r-09.webp', alt: '静物：白纱搭在旧木椅上，布料自然垂坠' },
  { src: '/images/reel/r-10.webp', alt: '静物：暗色石面上的细蜡烛与旧银器' },
  { src: '/images/reel/r-11.webp', alt: '氛围：雨夜的窗玻璃与外散景冷蓝灯光' },
  { src: '/images/reel/r-12.webp', alt: '建筑：老建筑石门廊，一道斜光扫过墙面' },
]

/* ── 02 · 个人经历 ──────────────────────────────────────── */
export const about = {
  index: '01',
  latin: 'ABOUT',
  title: '十二年，只做一件事',
  lead: '我是林深，一名独立摄影师。',
  paragraphs: [
    '2014 年，我辞掉设计院的工作，用攒下的钱买了第一台全画幅相机。那时候我拍得很慢——一场婚礼要按掉两千张，回来能选出十张就睡不着觉。',
    '十二年过去，我依然只做这一件事：在你最放松、最不设防的那个瞬间按下快门。我不安排你摆姿势，也不喊「看镜头笑一个」。我只是跟着你，等光落下来。',
  ],
  // 电话与邮箱是真实信息；微信不公开号码，一律走二维码
  // 注：工作室地址不对外公开，所以这里不展示；需要的话按同样结构加回来即可
  contacts: [
    { label: '电话', value: '183 7937 8173', href: 'tel:+8618379378173' },
    { label: '邮箱', value: '276238371@qq.com', href: 'mailto:276238371@qq.com' },
  ],
  // 项目数据（数字会滚动增长）
  stats: [
    { value: 6, suffix: '年', label: '独立拍摄经验' },
    { value: 300, suffix: '+', label: '完成的拍摄场次' },
    { value: 50, suffix: '+', label: '去过的城市' },
    { value: 96, suffix: '%', label: '复购与转介绍' },
  ],
  // 经历时间线
  timeline: [
    { year: '2014', title: '入行', desc: '从设计院辞职，进入商业摄影公司做助理，第一次摸到全画幅。' },
    { year: '2017', title: '独立', desc: '成立个人工作室，专注婚礼纪实与人像，全年完成 96 场拍摄。' },
    { year: '2021', title: '品牌', desc: '开始与消费品牌合作视觉拍摄，作品见于多个品牌的年度主视觉。' },
    { year: '2025', title: '至今', desc: '保持每年 70 场以内的拍摄量——宁可少拍，也不把任何一场拍成流水线。' },
  ],
}

/* ── 03 · 精选项目 ──────────────────────────────────────── */
/**
 * layout: 'wide'(7格) | 'narrow'(5格)，两行 7/5、5/7 交错。
 * image 指向 public/images/ 下的文件，替换同名图片即可换作品。
 * alt 请写清楚「谁、在哪、在做什么」——它既是读屏用户的唯一信息来源，也是图片搜索的入口。
 */
export const works = {
  index: '02',
  latin: 'SELECTED WORK',
  title: '精选项目',
  desc: '四个案子，四种光线。每一张都是现场发生的，没有一张是摆出来的。',
  /**
   * 球面画廊（DomeGallery）的照片源。
   *
   * ⚠️ 与 segments 严格联动：buildItems() 按 segments 列 × 5 行 生成格子，
   *    segments=8 → 40 格。照片少于格子数时源码会用 `i % length` 循环复用，
   *    也就是会出现重复。这里正好 40 张对 40 格，做到一张不重复。
   *
   * 这 40 张由本机 ComfyUI + Realistic Vision V6 生成（768×1024），
   * 再转成 512×683 的 WebP（合计约 1.5 MB）——DomeGallery 用普通 <img> 渲染
   * 全部格子、没有懒加载，所以体积必须压住。
   * 生成与转换脚本见 tools/gen-dome-photos.mjs 与 tools/convert-dome-photos.mjs。
   *
   * 换成真实作品时：把照片按 dome-01..40 命名放进 public/images/dome/ 即可，
   * 只需同步下面的 alt 文字。
   */
  gallery: [
    { src: '/images/dome/dome-01.webp', alt: '婚礼纪实：树林中逆光而立的新娘，含笑' },
    { src: '/images/dome/dome-02.webp', alt: '婚礼纪实：教堂烛光下的仪式，新人牵手相视' },
    { src: '/images/dome/dome-03.webp', alt: '婚礼细节：双手交换婚戒的瞬间' },
    { src: '/images/dome/dome-04.webp', alt: '婚礼纪实：宾客向新人撒花庆祝' },
    { src: '/images/dome/dome-05.webp', alt: '婚礼纪实：户外草坪上的宣誓仪式' },
    { src: '/images/dome/dome-06.webp', alt: '婚礼纪实：新人在圣坛前的初吻' },
    { src: '/images/dome/dome-07.webp', alt: '婚礼纪实：新人一起切婚礼蛋糕' },
    { src: '/images/dome/dome-08.webp', alt: '婚礼纪实：新人的第一支舞' },
    { src: '/images/dome/dome-09.webp', alt: '婚礼纪实：新娘抛出捧花，朋友们举手欢呼' },
    { src: '/images/dome/dome-10.webp', alt: '婚礼纪实：宣读誓言时新娘手持手写信' },
    { src: '/images/dome/dome-11.webp', alt: '人像：窗边柔和自然光下的女性肖像' },
    { src: '/images/dome/dome-12.webp', alt: '人像：戴头纱的新娘单人肖像' },
    { src: '/images/dome/dome-13.webp', alt: '人像：身着西装的新郎单人肖像' },
    { src: '/images/dome/dome-14.webp', alt: '人像：情侣对视而笑的近景' },
    { src: '/images/dome/dome-15.webp', alt: '人像：牵手微笑的老年夫妇' },
    { src: '/images/dome/dome-16.webp', alt: '家庭纪实：家长将欢笑的孩子举高' },
    { src: '/images/dome/dome-17.webp', alt: '人像：伴娘团在花园中欢笑合影' },
    { src: '/images/dome/dome-18.webp', alt: '人像：侧脸轮廓上的柔和轮廓光' },
    { src: '/images/dome/dome-19.webp', alt: '人像：女性回眸一笑的抓拍' },
    { src: '/images/dome/dome-20.webp', alt: '人像：情侣相拥的近景特写' },
    { src: '/images/dome/dome-21.webp', alt: '人像：开怀大笑的自然抓拍' },
    { src: '/images/dome/dome-22.webp', alt: '人像：透过婚纱头纱拍摄的肖像' },
    { src: '/images/dome/dome-23.webp', alt: '婚礼细节：新娘手捧花的近景' },
    { src: '/images/dome/dome-24.webp', alt: '婚礼细节：婚戒静置于织物上的微距' },
    { src: '/images/dome/dome-25.webp', alt: '婚礼细节：婚纱蕾丝与面料质感' },
    { src: '/images/dome/dome-26.webp', alt: '婚礼细节：请柬与干花、火漆印的平铺摆拍' },
    { src: '/images/dome/dome-27.webp', alt: '婚礼细节：婚鞋在软毯上的静物' },
    { src: '/images/dome/dome-28.webp', alt: '婚礼纪实：父亲牵着女儿走过通道' },
    { src: '/images/dome/dome-29.webp', alt: '婚礼纪实：新娘在镜前准备的清晨' },
    { src: '/images/dome/dome-30.webp', alt: '婚礼纪实：晚宴上斟满的香槟塔' },
    { src: '/images/dome/dome-31.webp', alt: '纪实：老城街道上牵手漫步的情侣' },
    { src: '/images/dome/dome-32.webp', alt: '纪实：海边黄昏相拥欢笑的新人' },
    { src: '/images/dome/dome-33.webp', alt: '纪实：金色麦田中并肩行走的情侣' },
    { src: '/images/dome/dome-34.webp', alt: '人像：玻璃温室里漫射光下的肖像' },
    { src: '/images/dome/dome-35.webp', alt: '纪实：黄昏时分湖边栈道上的散步' },
    { src: '/images/dome/dome-36.webp', alt: '纪实：山顶日落中并肩远望的情侣' },
    { src: '/images/dome/dome-37.webp', alt: '家庭纪实：老宅门廊上的午后时光' },
    { src: '/images/dome/dome-38.webp', alt: '纪实：傍晚露台上共享静谧的情侣' },
    { src: '/images/dome/dome-39.webp', alt: '人像：咖啡馆角落里的暖光肖像' },
    { src: '/images/dome/dome-40.webp', alt: '人像：书店阁楼暖光下的肖像' },
  ],
  items: [
    {
      id: 'w1',
      title: '林间的仪式',
      category: '婚礼纪实',
      year: '2025',
      place: '杭州 · 千岛湖',
      layout: 'wide',
      image: '/images/work-01.jpg',
      focal: 'center 42%',
      note: '全天跟拍 · 自然光 · 零补光',
      alt: '婚礼纪实：一对新人在树林中并肩站立的黑白合影',
    },
    {
      id: 'w2',
      title: '出发前的十分钟',
      category: '纪实摄影',
      year: '2024',
      place: '南昌 · 老城',
      layout: 'narrow',
      image: '/images/work-02.jpg',
      focal: 'center 32%',
      note: '抓拍 · 黑白胶片调',
      alt: '婚礼纪实：新娘坐在车内微笑，新郎站在半开的车门外',
    },
    {
      id: 'w3',
      title: '烛光下的誓言',
      category: '婚礼纪实',
      year: '2024',
      place: '上海 · 徐汇',
      layout: 'narrow',
      image: '/images/work-03.jpg',
      focal: 'center 34%',
      note: '教堂仪式 · 现场光 · 双机位',
      alt: '婚礼纪实：教堂内逆光下相拥的新人，地面是黑白几何花砖',
    },
    {
      id: 'w4',
      title: '掌心的纹样',
      category: '细节与人像',
      year: '2023',
      place: '深圳 · 南山',
      layout: 'wide',
      image: '/images/work-04.jpg',
      focal: 'center 48%',
      note: '微距特写 · 手工精修',
      alt: '婚礼细节特写：两只交握的手，手背绘有海娜纹样并戴有金饰',
    },
  ],
}

/* ── 02 · 拍摄系列 ──────────────────────────────────────── */
/**
 * 排版位置：首屏之后的第一块。
 *
 * 为什么这里不是「关于我」：客户在第二屏真正想确认的是「你拍什么、拍成
 * 什么样、我这种需求你能不能接」，而不是「你是谁」。个人故事回答的是后
 * 者，放这里等于把最弱的环节放在最强的位置上。所以这块给能力面，
 * 具体案例交给下一节「精选项目」。
 *
 * ⚠️ 每条的 meta 都是【服务口径】—— 客户会拿它来核对。交付周期、跟拍
 *    时长、机位数这些，上线前必须改成你真实做到的，不要为了显得专业
 *    写自己做不到的事。
 * ⚠️ 图片目前用的是 dome 系列占位图（与「精选项目」的 work-*.jpg 不重复）。
 *    换成真实作品时，保持 4:5 竖幅即可，CSS 用 aspect-ratio 裁切。
 */
export const series = {
  index: '01',
  latin: 'SERIES',
  title: '四类拍摄，各自一套做法',
  desc: '同一个快门，四种不同的耐心。先确认你要的是哪一类。',
  items: [
    {
      id: 'wedding',
      tag: 'WEDDING',
      title: '婚礼纪实',
      desc: '从清晨的准备到最后一场舞。不摆拍、不打断，只在真正发生的瞬间按下快门。',
      meta: '全天跟拍 · 双机位 · 先交小样再精修',
      image: '/images/dome/dome-28.webp',
      alt: '婚礼纪实：父亲牵着女儿走过通道',
      href: '#works',
    },
    {
      id: 'portrait',
      tag: 'PORTRAIT',
      title: '人像写真',
      desc: '一次只拍一个人。用一两个小时把「上镜」这件事拆掉，留下你认得出自己的那张。',
      meta: '半日或全日 · 自然光为主 · 精修 20-40 张',
      image: '/images/dome/dome-11.webp',
      alt: '人像：窗边柔和自然光下的女性肖像',
      href: '#works',
    },
    {
      id: 'family',
      tag: 'FAMILY',
      title: '家庭纪实',
      desc: '在孩子还愿意扑进你怀里的那几年。不布景、不换装，就在你家里拍。',
      meta: '到家里拍 · 2-3 小时 · 全家人不出镜也拍',
      image: '/images/dome/dome-16.webp',
      alt: '家庭纪实：家长将欢笑的孩子举高',
      href: '#works',
    },
    {
      id: 'brand',
      tag: 'BRAND',
      title: '品牌与静物',
      desc: '给需要「看起来贵」的产品做视觉。光线、质感、留白，为你的详情页和主视觉服务。',
      meta: '棚拍或上门 · 按张计费 · 含商用授权',
      image: '/images/dome/dome-24.webp',
      alt: '静物：婚戒静置于织物上的微距特写',
      href: '#works',
    },
  ],
}

/* ── 04 · 个人优势 ──────────────────────────────────────── */
export const strengths = {
  index: '03',
  latin: 'WHY ME',
  title: '把「拍好」这件事，拆成六件能做好的小事',
  desc: '摄影不只是按下快门。下面这些，是我五年里用真金白银的教训换来的规矩。',
  items: [
    {
      icon: 'clock',
      title: '五年的现场经验',
      desc: '860 多场拍摄，见过暴雨里的户外仪式、停电的宴会厅、哭到停不下来的新人。任何突发，都有备选方案。',
    },
    {
      icon: 'aperture',
      title: '单机位专注，每张都用心',
      desc: '一台机身，专注当下每一个决定性瞬间。没有设备切换的干扰，只把精力放在光线、构图和你的表情上。',
    },
    {
      icon: 'bolt',
      title: '48 小时交付小样',
      desc: '拍摄结束后的 48 小时内，你会先拿到全部小样在线选片。不用等一周才知道拍成什么样。',
    },
    {
      icon: 'chat',
      title: '拍摄前先聊透',
      desc: '正式拍摄前至少一次面对面（或视频）沟通，确认场地、时间、服装与想要的感觉，不做盲拍。',
    },
    {
      icon: 'sliders',
      title: '手工精修，不做塑料脸',
      desc: '保留皮肤质感与真实的明暗关系，只修掉不该留在画面里的东西。这是我对「修图」的理解。',
    },
    {
      icon: 'shield',
      title: '版权与隐私写进合同',
      desc: '未获得书面授权，你的照片绝不会出现在我的作品集或任何社交平台上。这条没有例外。',
    },
  ],
}

/* ── 05 · 服务套餐 ──────────────────────────────────────── */
/**
 * ⚠️ 下面三档的 price 全部是【示例数字】，上线前必须换成你的真实报价。
 *
 * 通行做法是给出「起价 + 档位」而不是完全隐藏价格：让预算不匹配的人提前退出，
 * 也让预算合适的人敢开口咨询——价格完全不露，等于把每个访客都丢给人工回答。
 *
 * 字段说明：
 *   price     —— 展示价，含货币符号
 *   priceNote —— 价格旁的量词，如「起 · 10 小时」
 *   featured  —— 是否标为推荐档（会高亮，建议全站只标一个）
 *   features  —— 包含项，建议 4–5 条，只写客户真正关心的（时长/张数/交付时间）
 */
export const services = {
  index: '04',
  latin: 'PACKAGES',
  title: '三档服务，按需要选',
  desc: '价格是起点不是终点——最终报价取决于场地、时长与交付要求。看不准的话，把需求发我，我给你一个明确方案。',
  items: [
    {
      id: 'portrait',
      name: '人像写真',
      tagline: '半日 · 单人 / 双人',
      price: '¥288',
      priceNote: '起 · 2 小时',
      lead: '适合个人形象、情侣纪念、毕业与家庭合影。',
      features: [
        '2 小时拍摄，1–2 个场地',
        '6 张精修照片',
        '拍摄前一次沟通，确认风格与服装',
        '7 个工作日交付高清原图',
      ],
    },
    {
      id: 'wedding',
      name: '婚礼纪实',
      tagline: '全天 · 双机位',
      price: '¥880',
      priceNote: '起 · 10 小时',
      lead: '从化妆到晚宴，完整一天不摆拍、不打断流程。',
      features: [
        '10 小时跟拍，两台机身双备份',
        '约 50 张成片，全数精修',
        '拍摄前踩点 + 流程沟通',
        '72 小时内交付小样在线选片',
        '精修相册一本（20 页）',
      ],
      featured: true,
    },
    {
      id: 'commercial',
      name: '商业影像',
      tagline: '按项目 · 含场地方案',
      price: '¥600',
      priceNote: '起 / 天',
      lead: '品牌视觉、产品、空间与团队形象。',
      features: [
        '按天计费，含前期方案沟通',
        '产品 / 空间 / 人物多类型可选',
        '含基础场景搭建与灯光方案',
        '商用授权，提供多尺寸导出',
      ],
    },
  ],
  footnote: '以上为参考起价，不含异地交通与住宿。正式合作前会提供书面报价与合同，价格与交付内容以合同为准。',
}

/* ── 06 · 预约（整屏收尾） ──────────────────────────────── */
export const booking = {
  index: '05',
  latin: 'BOOKING',
  titleLines: ['聊聊你想留下的', '那个瞬间'],
  desc: '档期通常需要提前 2–3 周预约。把下面几项填好发给我，我会在 24 小时内回复是否还有档期，以及具体报价。',

  form: {
    // 拍摄类型下拉项
    types: ['婚礼纪实', '人像写真', '商业影像', '家庭记录', '其他 / 还没想好'],
    submit: '提交预约',
    // 说明提交后会发生什么，避免用户以为点了没反应
    note: '提交后会打开你的邮件客户端，把内容发到 276238371@qq.com。不喜欢用邮件的话，用右边的微信咨询。',
    copy: '复制后去微信发我',
    copied: '已复制，去微信粘贴即可',
  },

  wechat: {
    label: '微信咨询',
    /**
     * 微信二维码：把你的二维码图片命名为 wechat-qr.png 放进 public/images/ 即可生效。
     * 文件不存在时页面会自动显示一张占位图，不会破版。
     * 注意：卡片图里带的头像和昵称已经裁掉，只保留二维码本体。
     */
    qr: '/images/wechat-qr.png',
    hint: '扫码加我微信，看到会尽快回复',
    modalTitle: '微信扫码咨询',
    cardHint: '扫码添加好友',
  },

  channels: [
    { k: 'PHONE', label: '电话 / 短信', value: '183 7937 8173', href: 'tel:+8618379378173' },
    { k: 'EMAIL', label: '邮箱', value: '276238371@qq.com', href: 'mailto:276238371@qq.com' },
    // 不公开微信号，点击直接弹二维码
    { k: 'WECHAT', label: '微信', value: '扫码添加好友', action: 'wechat' },
  ],

  hours: '接待时间 10:00 – 20:00 · 全年无休（拍摄日可能延迟回复）',

  footer: {
    copyright: '© 2026 LINSHEN.STUDIO',
    icp: '赣ICP备 00000000 号', // 示例：备案号
    note: '本站为演示版本，项目数据与作品图均为示意内容。',
  },
}
