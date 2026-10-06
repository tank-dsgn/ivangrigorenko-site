import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// Палитра сайта. Значения живут в app/globals.css (@theme) — здесь читаются оттуда же,
// поэтому поменяв токен в CSS, увидите новое значение и тут, и на сайте.
const tokens = [
  { name: "accent", cls: "bg-accent", role: "Primary: links, active nav item, contact block title, hover" },
  { name: "accent-soft", cls: "bg-accent-soft", role: "Burger and close icons of the menu" },
  { name: "ink", cls: "bg-ink", role: "Headings" },
  { name: "body-strong", cls: "bg-body-strong", role: "Subheadings, case study text" },
  { name: "body", cls: "bg-body", role: "Descriptions, body text" },
  { name: "muted", cls: "bg-muted", role: "Tags, inactive navigation, button label" },
  { name: "faint", cls: "bg-faint", role: "Social icons, button outline" },
  { name: "surface", cls: "bg-surface", role: "Backdrop under a project card image" },
  { name: "thumb", cls: "bg-thumb", role: "Backdrop of a related card while its image loads" },
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
  title: "Foundations/Colors",
  parameters: { layout: "padded", controls: { disable: true } },
};
export default meta;

export const Palette: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      {tokens.map((t) => (
        <Swatch key={t.name} {...t} />
      ))}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-[#fafaf9] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]" />
        <div>
          <div className="text-ink text-[16px] leading-6 font-semibold">
            page background <span className="text-muted font-normal">#fafaf9</span>
          </div>
          <div className="text-body text-[14px] leading-5">
            Background of card sections and the menu screen. No token: the value comes from the mockup.
          </div>
        </div>
      </div>
    </div>
  ),
};
