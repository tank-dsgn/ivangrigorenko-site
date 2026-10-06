import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const radii = [
  { value: 4, use: "Мелкие плашки в схемах" },
  { value: 8, use: "Картинки и блоки в кейсах" },
  { value: 12, use: "Карточка проекта на телефоне, экраны в кейсах" },
  { value: 16, use: "Карточка проекта на планшете" },
  { value: 24, use: "Карточка проекта на десктопе" },
  { value: 999, use: "Кнопки" },
];

const shadows = [
  { name: "Карточка", value: "0 8px 20px 0 rgba(0, 0, 0, 0.1)", use: "Карточка проекта в покое. Токен --shadow-card" },
  { name: "Карточка при наведении", value: "0 8px 24px 0 rgba(64, 62, 92, 0.3)", use: "Карточка проекта под курсором, вместе с подъёмом на 6px" },
  { name: "Маленькая карточка", value: "0 2px 6px 0 rgba(13, 18, 46, 0.3)", use: "Карточка «Смотрите также» в покое; под курсором — та же тень, что у карточки проекта" },
  { name: "Экран", value: "0 2px 6px 0 rgba(13, 18, 46, 0.15)", use: "Скриншоты экранов в кейсах" },
  { name: "Свечение кнопки", value: "inset 0 0 0 2px #4f46e5, 0 0 0 4px rgba(79, 70, 229, 0.12), 0 8px 24px -8px rgba(79, 70, 229, 0.45)", use: "Кнопка «Связаться со мной» под курсором" },
];

const meta: Meta = {
  title: "Основы/Скругления и тени",
  parameters: { layout: "padded", controls: { disable: true }, backgrounds: { value: "page" } },
};
export default meta;

export const Скругления: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {radii.map((r) => (
        <div key={r.value} className="flex w-40 flex-col gap-2">
          <div className="h-24 bg-white shadow-[inset_0_0_0_1px_#94a3b8]" style={{ borderRadius: r.value }} />
          <div className="text-ink text-[14px] leading-5 font-semibold">{r.value === 999 ? "999 (полное)" : `${r.value}px`}</div>
          <div className="text-body text-[12px] leading-4">{r.use}</div>
        </div>
      ))}
    </div>
  ),
};

export const Тени: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-8 p-4">
      {shadows.map((s) => (
        <div key={s.name} className="flex w-56 flex-col gap-3">
          <div className="h-28 rounded-2xl bg-white" style={{ boxShadow: s.value }} />
          <div className="text-ink text-[14px] leading-5 font-semibold">{s.name}</div>
          <div className="text-body text-[12px] leading-4">{s.use}</div>
          <code className="text-muted text-[12px] leading-4 break-words">{s.value}</code>
        </div>
      ))}
    </div>
  ),
};
