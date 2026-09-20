export type Project = {
  /** Ключ для React и для будущих страниц кейсов */
  slug: string;
  href: string;
  /** Надтекст над заголовком. tagNarrow — вариант для планшета и телефона. */
  tag: string;
  tagNarrow?: string;
  title: string;
  description: string;
  image: string;
  /** Подложка под картинкой: виден только если картинка не закрывает панель целиком */
  backdrop?: string;
  /**
   * Масштаб поверх object-fit: cover.
   * В оригинале кадрирование задано в Figma; здесь тот же кроп воспроизводится
   * как cover + небольшой зум.
   */
  zoom?: number;
  /** Высота картинки на мобильном (в оригинале у первой карточки она ниже) */
  mobileImageHeight?: number;
};

export const projects: Project[] = [
  {
    slug: "eazychange",
    href: "/eazychange-ru",
    tag: "Финтех / UX/UI / Адаптивность",
    title: "Быстрый и интуитивный криптообменник",
    description:
      "Создание плавного UX для мгновенных обменов — с акцентом на простоту, доверие и скорость",
    image: "/img/eazychange.png",
    mobileImageHeight: 210,
  },
  {
    slug: "autotor",
    href: "/autotor-ru",
    tag: "E-Commerce / UX-UI / Монетизация",
    title: "Платные функции для autotor.pl",
    description:
      "Проектирование адаптивного пользовательского сценария для покупки и активации платных опций",
    image: "/img/autotor.png",
    backdrop: "var(--color-surface)",
  },
  {
    slug: "pot",
    href: "/pot-ru",
    tag: "Лайфстайл / Приложение / UX-UI",
    title: "Приложение для ухода за растениями",
    description:
      "Интуитивное приложение, которое помогает распознавать, отслеживать и ухаживать за растениями — просто и с удовольствием",
    image: "/img/pot.png",
    backdrop:
      "linear-gradient(133.6deg, #fafaf9 0%, #c8d9c7 25%, #95b995 50%, #639862 75%, #498749 87.5%, #307730 100%)",
  },
  {
    slug: "ostral",
    href: "/ostral-ru",
    tag: "Web App/ UX-UI / SaaS",
    tagNarrow: "Web App/ UX-UI / B2B",
    title: "Платформа управления инспекциями",
    description:
      "Проектирование data-heavy B2B платформы для контроля рисков и инспекций на промышленных объектах — от UX-логики до финального UI",
    image: "/img/ostral.png",
    zoom: 1.03,
  },
  {
    slug: "vv",
    href: "/vv-ru",
    tag: "Figma / Дизайн система",
    title: "Дизайн cистема",
    description:
      "Разработка и развитие внутренней дизайн-системы, обеспечивающей консистентность интерфейсов, масштабируемость решений и предсказуемый процесс проектирования",
    image: "/img/vv.png",
    zoom: 1.28,
  },
  {
    slug: "mikulich",
    href: "/mikulich-ru",
    tag: "Брендинг / Айдентика",
    title: "Визуальная айдентика для Dr. Mikulich",
    description:
      "Создание элегантного логотипа для Dr. Dzmitry Mikulich — отражающего точность, доверие и эстетику",
    image: "/img/mikulich.png",
  },
];

export const contactEmail = "Ivan.Grigorenko.dsgn@gmail.com";

export const mailtoHref =
  "mailto:ivan.grigorenko.dsgn@gmail.com" +
  "?subject=Let's%20Work%20Together" +
  "&body=Hi%20Ivan,%0A%0AI%20just%20checked%20your%20portfolio%20and%20really%20liked%20your%20work." +
  "%0AI'm%20interested%20in%20collaborating%20with%20you.%0A%0ARegards,%0A[Your%20Name]";

export const socials = [
  { name: "Behance", href: "https://www.behance.net/ivangrigorenko", icon: "/img/behance.svg" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/ivan-grigorenko-1382b0156/", icon: "/img/linkedin.svg" },
  { name: "Dribbble", href: "https://dribbble.com/ivangrigorenko", icon: "/img/dribbble.svg" },
];
