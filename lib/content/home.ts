import { asset, type Lang } from "@/lib/site";

export type Project = {
  slug: string;
  tag: string;
  /** вариант тега для планшета и телефона, если он отличается от десктопного */
  tagNarrow?: string;
  title: string;
  description: string;
  image: string;
  /** подложка под картинкой — видна, только если картинка не закрывает панель */
  backdrop?: string;
  /** масштаб поверх object-fit: cover — так воспроизводится кроп из Figma */
  zoom?: number;
  /** высота панели с картинкой на телефоне (у первой карточки она ниже) */
  mobileImageHeight?: number;
};

const shared: Record<string, Pick<Project, "image" | "backdrop" | "zoom" | "mobileImageHeight">> = {
  eazychange: { image: asset("0abd75a1f3ca4a393b921b8d9e99e51d7b4d8023.png"), mobileImageHeight: 210 },
  autotor: { image: asset("9f3219e6ef42c180aaa1ce89fed0d991917ce2f6.png"), backdrop: "var(--color-surface)" },
  pot: {
    image: asset("3889c3836a33b95d879d1c241252c56ac79265ea.png"),
    backdrop:
      "linear-gradient(133.6deg, #fafaf9 0%, #c8d9c7 25%, #95b995 50%, #639862 75%, #498749 87.5%, #307730 100%)",
  },
  ostral: { image: asset("4baa3b25cdf0b7626f677ae4c993a74c012364f6.png"), zoom: 1.03 },
  vv: { image: asset("996483337ecf68f87010b9184eb74478e98ccbf8.png"), zoom: 1.28 },
  mikulich: { image: asset("0d1a450fec69d52e6ec1b4ae9b9da7dd2c9961c2.png") },
};

const ru: Omit<Project, "image" | "backdrop" | "zoom" | "mobileImageHeight">[] = [
  { slug: "eazychange", tag: "Финтех / UX/UI / Адаптивность", title: "Быстрый и интуитивный криптообменник", description: "Создание плавного UX для мгновенных обменов — с акцентом на простоту, доверие и скорость" },
  { slug: "autotor", tag: "E-Commerce / UX-UI / Монетизация", title: "Платные функции для autotor.pl", description: "Проектирование адаптивного пользовательского сценария для покупки и активации платных опций" },
  { slug: "pot", tag: "Лайфстайл / Приложение / UX-UI", title: "Приложение для ухода за растениями", description: "Интуитивное приложение, которое помогает распознавать, отслеживать и ухаживать за растениями — просто и с удовольствием" },
  { slug: "ostral", tag: "Web App/ UX-UI / SaaS", tagNarrow: "Web App/ UX-UI / B2B", title: "Платформа управления инспекциями", description: "Проектирование data-heavy B2B платформы для контроля рисков и инспекций на промышленных объектах — от UX-логики до финального UI" },
  { slug: "vv", tag: "Figma / Дизайн система", title: "Дизайн cистема", description: "Разработка и развитие внутренней дизайн-системы, обеспечивающей консистентность интерфейсов, масштабируемость решений и предсказуемый процесс проектирования" },
  { slug: "mikulich", tag: "Брендинг / Айдентика", title: "Визуальная айдентика для Dr. Mikulich", description: "Создание элегантного логотипа для Dr. Dzmitry Mikulich — отражающего точность, доверие и эстетику" },
];

const en: Omit<Project, "image" | "backdrop" | "zoom" | "mobileImageHeight">[] = [
  { slug: "eazychange", tag: "Fintech / UX/UI design / Responsive", title: "Fast & intuitive crypto exchange", description: "Designing a seamless UX for instant crypto swaps, focused on simplicity, trust, and speed" },
  { slug: "autotor", tag: "E-Commerce / UX-UI / Paid flow", title: "Paid features for autotor.pl", description: "Designing responsive user flows for purchasing and activating paid features" },
  { slug: "pot", tag: "Lifestyle / Mobile app / UX–UI", title: "Plant care mobile app", description: "An intuitive app that helps users identify, track, and care for plants — simple and enjoyable to use" },
  { slug: "ostral", tag: "Web App/ UX-UI / B2B", title: "Inspection management platform", description: "Designing a data-heavy B2B platform for risk monitoring and industrial facility inspections — from UX logic to final UI" },
  { slug: "vv", tag: "Figma / Design system", title: "Design system", description: "Designing and evolving an internal design system that ensures UI consistency, scalable solutions, and a predictable design process" },
  { slug: "mikulich", tag: "Branding / Identity", title: "Visual identity for Dr. Mikulich", description: "Creating an elegant logo for Dr. Dzmitry Mikulich, reflecting precision, trust, and aesthetics" },
];

const withAssets = (list: typeof ru): Project[] =>
  list.map((p) => ({ ...p, ...shared[p.slug] }));

export const projects: Record<Lang, Project[]> = {
  ru: withAssets(ru),
  en: withAssets(en),
};

/** Ссылка на страницу кейса в нужном языке */
export const caseHref = (slug: string, lang: Lang) => `/${slug}-${lang}`;

export const cursorArrow = asset("3124b15427ab957b9ad6f72de3a4cb4968ec1ef0.svg");

type HeroContent = {
  /** подзаголовок; на телефоне в оригинале он короче */
  eyebrow: string;
  eyebrowShort: string;
  headline: [string, string, string];
  /** положение курсора-стрелки относительно текстового блока на десктопе */
  arrow: { left: number; top: number };
  /** нижний отступ секции на десктопе: в оригинале он зависит от числа строк заголовка */
  desktopBottomPad: number;
};

export const hero: Record<Lang, HeroContent> = {
  ru: {
    eyebrow: "Привет, я Иван Григоренко — UX/UI дизайнер",
    eyebrowShort: "Я Иван Григоренко — UX/UI дизайнер",
    headline: ["Создаю понятные, эстетичные и продуманные ", "цифровые", " продукты"],
    arrow: { left: 611, top: 140 },
    desktopBottomPad: 136,
  },
  en: {
    eyebrow: "Hello, I’m Ivan Grigorenko — UX/UI Designer",
    eyebrowShort: "I’m Ivan Grigorenko — UX/UI Designer",
    headline: ["I craft clear, intuitive ", "digital", " products"],
    arrow: { left: 646, top: 90 },
    desktopBottomPad: 116,
  },
};
