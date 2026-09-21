import { asset, type Lang } from "@/lib/site";

export const portrait = asset("30fdd29f713c9d310a3815868a1edfb5ca53a84b.png");

/**
 * Иконки инструментов. Третья в оригинале собрана из трёх слоёв,
 * поэтому у неё есть overlay — смещения сняты с оригинала (бокс 34×34).
 */
export const tools = [
  { icon: asset("480abb8d1b961a74b872a9ef5ddb48a181a76bc3.svg") },
  { icon: asset("9bacd2ff04df8a8e4476f18acf349279f039d93a.svg") },
  {
    icon: asset("df19bdaf69d340288e794d2398f7a24c3810cc4f.svg"),
    overlays: [
      { src: asset("7cc7c3a507dd7d25672345d231d86baf9c877088.svg"), x: 7, y: 6, w: 9, h: 20 },
      { src: asset("5d2ea06262d26e5175ed4711a314986569352a3d.svg"), x: 19, y: 6, w: 9, h: 12 },
    ],
  },
  { icon: asset("537320482c235c70f08ffb0e2c5ec06571d8e310.svg") },
];

export const badges = [
  asset("a996d82f030a32f29942b64590c110a0341e6da7.png"),
  asset("25f881449445b1d31c0dd8c8dfb8084755c998d4.png"),
];

type AboutContent = {
  heading: string;
  paragraphs: string[];
  toolsLabel: string;
  resumeLabel: string;
  resumeHref: string;
};

export const aboutContent: Record<Lang, AboutContent> = {
  ru: {
    heading: "Рад знакомству",
    paragraphs: [
      "Привет, я Иван — UX/UI дизайнер. Работаю с финтехом,\nE-commerce, B2B и B2C продуктами и мобильными приложениями. Строю дизайн-системы, проектирую сложные пользовательские сценарии. Иногда захожу в брендинг и айдентику.",
      "Я проектировал интерфейсы в составе команд и самостоятельно. В обоих форматах главное для меня одно — чтобы решение работало не только в макете, но и в реальном продукте. Мне интересны продукты, где дизайн — это не украшение, а инструмент.",
      "Мне близок системный подход: токены, компоненты, консистентность. Я думаю о том, насколько интерфейс легко поддерживать и масштабировать — и проектирую с расчётом на это.",
      "В дизайне с 2018 года — параллельно с другой карьерой. За это время был и фриланс, и фулл-тайм опыт в студии. Нелинейный путь, но именно он сформировал привычку работать чётко, быстро входить в контекст и не размениваться на лишнее.",
    ],
    toolsLabel: "Мои инструменты",
    resumeLabel: "Скачать моё резюме",
    resumeHref:
      "https://drive.google.com/file/d/1J8gGYmYW7dR_ehtD8nIM2CvrGjKt9Ihm/view?usp=sharing",
  },
  en: {
    heading: "Nice to meet you",
    paragraphs: [
      "Hi, I'm Ivan — a UX/UI designer. I work with fintech, e-commerce, B2B and B2C products, and mobile applications. I build design systems and design complex user flows. I occasionally venture into branding and identity",
      "I've designed interfaces both as part of teams and independently. In both formats, what matters most to me is that the solution works not just in the mockup, but in the real product. I'm drawn to products where design is a tool, not decoration",
      "I have an affinity for a systematic approach: tokens, components, consistency. I think about how easy an interface is to maintain and scale — and I design with that in mind",
      "I've been in design since 2018 — alongside another career. Over that time I've done freelance and full-time work at a studio. It's been a non-linear path, but it's exactly what shaped my habit of working with precision, getting up to speed quickly, and not wasting time on the unnecessary",
    ],
    toolsLabel: "My tools",
    resumeLabel: "Download my resume",
    resumeHref:
      "https://drive.google.com/file/d/17Mh3cn1-FX5Q3GEmsO7T0gzVTVxZP5tQ/view?usp=sharing",
  },
};
