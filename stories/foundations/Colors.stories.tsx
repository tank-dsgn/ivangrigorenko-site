import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// Палитра сайта. Значения живут в app/globals.css (@theme) — здесь читаются оттуда же,
// поэтому поменяв токен в CSS, увидите новое значение и тут, и на сайте.
const tokens = [
  { name: "accent", cls: "bg-accent", role: "Основной: ссылки, активный пункт, заголовок блока контактов, наведение" },
  { name: "accent-soft", cls: "bg-accent-soft", role: "Бургер и крестик меню" },
  { name: "ink", cls: "bg-ink", role: "Заголовки" },
  { name: "body-strong", cls: "bg-body-strong", role: "Подзаголовки, текст кейсов" },
  { name: "body", cls: "bg-body", role: "Описания, основной текст" },
  { name: "muted", cls: "bg-muted", role: "Теги, неактивная навигация, текст кнопки" },
  { name: "faint", cls: "bg-faint", role: "Иконки соцсетей, обводка кнопки" },
  { name: "surface", cls: "bg-surface", role: "Подложка под картинкой карточки" },
  { name: "thumb", cls: "bg-thumb", role: "Подложка маленькой карточки «Смотрите также», пока грузится картинка" },
];

function Swatch({ name, cls, role }: { name: string; cls: string; role: string }) {
  const value =
    typeof window === "undefined"
      ? ""
      : getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
  return (
    <div className="flex items-center gap-4">
      <div
        // класс записан целиком: Tailwind кладёт в CSS только те токены, которые встретил в коде
        className={`h-14 w-14 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] ${cls}`}
      />
      <div className="min-w-0">
        <div className="text-ink text-[16px] leading-6 font-semibold">
          {name} <span className="text-muted font-normal">{value}</span>
        </div>
        <div className="text-body text-[14px] leading-5">{role}</div>
        <code className="text-muted text-[12px] leading-4">
          text-{name} · bg-{name} · var(--color-{name})
        </code>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Основы/Цвета",
  parameters: { layout: "padded", controls: { disable: true } },
};
export default meta;

export const Палитра: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      {tokens.map((t) => (
        <Swatch key={t.name} {...t} />
      ))}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-[#fafaf9] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]" />
        <div>
          <div className="text-ink text-[16px] leading-6 font-semibold">
            фон страницы <span className="text-muted font-normal">#fafaf9</span>
          </div>
          <div className="text-body text-[14px] leading-5">
            Фон секций с карточками и экрана меню. Токена нет — значение приходит из макета.
          </div>
        </div>
      </div>
    </div>
  ),
};
