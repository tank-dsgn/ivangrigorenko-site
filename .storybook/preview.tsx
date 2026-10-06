import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";
import "../app/figma-fonts.css";
import "./preview.css";

// ширины, под которые свёрстан сайт: телефон < 800, планшет 800–1279, десктоп от 1280
const viewports = {
  mobile: { name: "Mobile 375", styles: { width: "375px", height: "812px" } },
  tablet: { name: "Tablet 800", styles: { width: "800px", height: "1024px" } },
  desktop: { name: "Desktop 1280", styles: { width: "1280px", height: "800px" } },
  wide: { name: "Desktop 1440", styles: { width: "1440px", height: "900px" } },
};

const preview: Preview = {
  parameters: {
    layout: "centered",
    viewport: { options: viewports },
    backgrounds: {
      options: {
        white: { name: "White", value: "#ffffff" },
        page: { name: "Page background", value: "#fafaf9" },
        dark: { name: "Dark", value: "#0f172a" },
      },
    },
    nextjs: { appDirectory: true },
    controls: { expanded: true },
    options: {
      storySort: { order: ["Foundations", ["Colors", "Typography", "Spacing", "Radii & shadows", "Motion"], "Components"] },
    },
  },
  initialGlobals: { backgrounds: { value: "white" } },
};

export default preview;
