import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// Стили текста, которые реально встречаются на страницах (подсчитано по вёрстке из макета).
// Шрифт один — Open Sans, начертания 400 / 600 / 700.
const styles = [
  { size: 48, line: 48, weight: 700, use: "Крупные цифры в кейсах" },
  { size: 36, line: 40, weight: 700, use: "Заголовок страницы и секции кейса (десктоп)" },
  { size: 30, line: 36, weight: 700, use: "Заголовок секции (планшет)" },
  { size: 30, line: 36, weight: 600, use: "Название проекта в карточке, заголовок блока контактов (десктоп)" },
  { size: 24, line: 32, weight: 700, use: "Подзаголовки в кейсах" },
  { size: 24, line: 32, weight: 600, use: "Название проекта в карточке (планшет)" },
  { size: 20, line: 28, weight: 600, use: "Название проекта в карточке (телефон)" },
  { size: 20, line: 28, weight: 400, use: "Основной текст кейса и «Обо мне» (десктоп)" },
  { size: 18, line: 28, weight: 600, use: "Кнопка «Связаться со мной» (десктоп)" },
  { size: 18, line: 28, weight: 400, use: "Описание проекта в карточке (десктоп)" },
  { size: 16, line: 24, weight: 600, use: "Навигация, кнопки" },
  { size: 16, line: 24, weight: 400, use: "Основной текст (планшет и телефон)" },
  { size: 14, line: 20, weight: 400, use: "Теги карточки (десктоп), подписи" },
  { size: 12, line: 16, weight: 600, use: "Мелкие заголовки таблиц и схем" },
  { size: 12, line: 16, weight: 400, use: "Теги карточки (планшет, телефон), подписи к схемам" },
];

const meta: Meta<{ sample: string }> = {
  title: "Основы/Типографика",
  parameters: { layout: "padded" },
  args: { sample: "Быстрый и интуитивный криптообменник" },
  argTypes: { sample: { name: "Текст-пример", control: "text" } },
};
export default meta;

export const Шкала: StoryObj<{ sample: string }> = {
  render: ({ sample }) => (
    <div className="flex flex-col gap-6">
      {styles.map((s) => (
        <div key={`${s.size}-${s.weight}`} className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
          <div className="text-muted w-56 shrink-0 text-[12px] leading-4">
            <div className="text-ink font-semibold">
              {s.size} / {s.line} · {s.weight}
            </div>
            {s.use}
          </div>
          <div
            className="text-ink min-w-0"
            style={{ fontSize: s.size, lineHeight: `${s.line}px`, fontWeight: s.weight }}
          >
            {sample}
          </div>
        </div>
      ))}
    </div>
  ),
};
