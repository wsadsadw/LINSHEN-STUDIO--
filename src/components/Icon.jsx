/** 极简描边图标集 —— 只用于「个人优势」卡片，统一 24×24 / 1.2px 描边 */
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const paths = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.8v5.4l3.6 2.1" />
    </>
  ),
  aperture: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M14.31 9.1 20.05 19.4M9.69 9.1h11.6M7.38 13.1l5.74-9.9M9.69 17.1 3.95 6.8M14.31 17.1H2.71M16.62 13.1 10.88 23" />
    </>
  ),
  bolt: <path d="M13 2.5 4.8 13.6h7.1l-.9 8 8.2-11.1h-7.1l.9-8Z" />,
  chat: (
    <path d="M20.6 11.4a7.9 7.9 0 0 1-.85 3.6 8.1 8.1 0 0 1-7.2 4.5 7.9 7.9 0 0 1-3.6-.85L4 20.3l1.75-5.4a7.9 7.9 0 0 1-.85-3.6 8.1 8.1 0 0 1 4.5-7.2 7.9 7.9 0 0 1 3.6-.85h.5a8.1 8.1 0 0 1 7.6 7.6v.55Z" />
  ),
  sliders: (
    <>
      <path d="M4.5 20.5v-6.2M4.5 10.3V3.5M12 20.5v-8.4M12 8.1V3.5M19.5 20.5v-4.4M19.5 12.1V3.5" />
      <path d="M2 14.3h5M9.5 8.1h5M17 16.1h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 21.5s7.6-3.8 7.6-9.5V5.7L12 2.8 4.4 5.7v6.3c0 5.7 7.6 9.5 7.6 9.5Z" />
      <path d="m9 12.1 2.1 2.1 4-4.2" />
    </>
  ),
}

export default function Icon({ name }) {
  return <svg {...base}>{paths[name] ?? paths.aperture}</svg>
}
