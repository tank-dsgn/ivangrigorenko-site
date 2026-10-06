import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";
import "../app/figma-fonts.css";
import "./preview.css";

// ширины, под которые свёрстан сайт: телефон < 800, планшет 800–1279, десктоп от 1280
const viewports = {
  mobile: { name: "Телефон 375", styles: { width: "375px", height: "812px" } },
  tablet: { name: "Планшет 800", styles: { width: "800px", height: "1024px" } },
  desktop: { name: "Десктоп 1280", styles: { width: "1280px", height: "800px" } },
  wide: { name: "Десктоп 1440", styles: { width: "1440px", height: "900px" } },
};

const preview: Preview = {
  parameters: {
    layout: "centered",
    viewport: { options: viewports },
    backgrounds: {
      options: {
        white: { name: "Белый", value: "#ffffff" },
        page: { name: "Фон страницы", value: "#fafaf9" },
        dark: { name: "Тёмный", value: "#0f172a" },
      },
    },
    nextjs: { appDirectory: true },
    controls: { expanded: true },
    options: {
      storySort: { order: ["Основы", ["Цвета", "Типографика", "Отступы", "Скругления и тени", "Движение"], "Компоненты", "Блоки"] },
    },
  },
  initialGlobals: { backgrounds: { value: "white" } },
};

export default preview;
