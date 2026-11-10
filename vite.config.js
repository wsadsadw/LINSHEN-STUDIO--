import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { annotateBridge } from './vite-plugins/annotate-bridge.mjs'

// 固定端口，方便本地预览与后续截图比对
export default defineConfig({
  /**
   * annotateBridge：dev-only 的「点选批注」桥。
   * 页面里按住 Alt 点击任意元素 → 生成结构化批注（选择器 / 组件 / 源码行号 /
   * 计算样式）→ 写进 .annotations/annotations.jsonl，模型据此精确改代码。
   * apply: 'serve'，构建产物不含这部分。
   */
  plugins: [react(), annotateBridge()],
  server: {
    host: '127.0.0.1',
    port: 5273,
    strictPort: true,
    watch: {
      /**
       * public/media 下放的是音频、视频这类大体积二进制文件。
       * Vite 的 node 文件监听器在这些文件被占用时会抛 `EBUSY: resource busy or
       * locked, watch '...mp3'` 并直接让 dev server 退出 —— 实测踩到过两次：
       * 一次是 mp3 刚复制完句柄还没释放，一次是音频正在被浏览器读取。
       *
       * 它们只是静态资源，改完刷新页面即可，本来也不需要 HMR 监听。
       * 忽略掉，开发服务器就不会再因为这个原因整个挂掉。
       */
      ignored: ['**/public/media/**', '**/.annotations/**'],
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1200,
  },
})
