import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// Шкала отступов: только эти значения. Не кратное 4 (кроме 2 и 6) — ошибка.
const scale = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];

const breakpoints = [
  { name: "Телефон", range: "до 799px", frame: 375, prefix: "без префикса", side: 20 },
  { name: "Планшет", range: "800–1279px", frame: 800, prefix: "md:", side: 40 },
  { name: "Десктоп", range: "от 1280px", frame: 1280, prefix: "xl:", side: 56 },
];

const meta: Meta = {
  title: "Основы/Отступы",
  parameters: { layout: "padded", controls: { disable: true } },
};
export default meta;

export const Шкала: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      {scale.map((v) => (
        <div key={v} className="flex items-center gap-4">
          <div className="text-ink w-10 text-right text-[14px] leading-5 font-semibold">{v}</div>
          <div className="bg-accent h-4 rounded-sm" style={{ width: Math.max(v, 1) }} />
          <code className="text-muted text-[12px] leading-4">
            p-{v / 4} · gap-{v / 4}
          </code>
        </div>
      ))}
    </div>
  ),
};

export const Брейкпоинты: StoryObj = {
  render: () => (
    <table className="text-body border-separate border-spacing-x-6 border-spacing-y-2 text-left text-[14px] leading-5">
      <thead className="text-muted text-[12px] leading-4 uppercase">
        <tr>
          <th className="font-normal">Экран</th>
          <th className="font-normal">Ширина окна</th>
          <th className="font-normal">Фрейм в макете</th>
          <th className="font-normal">Префикс Tailwind</th>
          <th className="font-normal">Поля шапки</th>
        </tr>
      </thead>
      <tbody>
        {breakpoints.map((b) => (
          <tr key={b.name}>
            <td className="text-ink font-semibold">{b.name}</td>
            <td>{b.range}</td>
            <td>{b.frame}px</td>
            <td>
              <code>{b.prefix}</code>
            </td>
            <td>{b.side}px</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
