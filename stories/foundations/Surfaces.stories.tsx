import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const radii = [
  { value: 4, use: "Small chips in diagrams" },
  { value: 8, use: "Images and blocks in case studies" },
  { value: 12, use: "Project card on mobile, screens in case studies" },
  { value: 16, use: "Project card on tablet" },
  { value: 24, use: "Project card on desktop" },
  { value: 999, use: "Buttons" },
];

const shadows = [
  { name: "Card", value: "0 8px 20px 0 rgba(0, 0, 0, 0.1)", use: "Project card at rest. Token --shadow-card" },
  { name: "Card, hover", value: "0 8px 24px 0 rgba(64, 62, 92, 0.3)", use: "Project card under the cursor, together with a 6px lift. Token --shadow-card-hover" },
  { name: "Related card", value: "0 2px 6px 0 rgba(13, 18, 46, 0.3)", use: "Related card at rest; under the cursor it takes the card hover shadow. Token --shadow-thumb" },
  { name: "Screen", value: "0 2px 6px 0 rgba(13, 18, 46, 0.15)", use: "Screenshots in case studies" },
  { name: "Button glow", value: "inset 0 0 0 2px #4f46e5, 0 0 0 4px rgba(79, 70, 229, 0.12), 0 8px 24px -8px rgba(79, 70, 229, 0.45)", use: "Contact button under the cursor" },
];

const meta: Meta = {
  title: "Foundations/Radii & shadows",
  parameters: { layout: "padded", controls: { disable: true }, backgrounds: { value: "page" } },
};
export default meta;

export const Radii: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {radii.map((r) => (
        <div key={r.value} className="flex w-40 flex-col gap-2">
          <div className="h-24 bg-white shadow-[inset_0_0_0_1px_#94a3b8]" style={{ borderRadius: r.value }} />
          <div className="text-ink text-[14px] leading-5 font-semibold">{r.value === 999 ? "999 (full)" : `${r.value}px`}</div>
          <div className="text-body text-[12px] leading-4">{r.use}</div>
        </div>
      ))}
    </div>
  ),
};

export const Shadows: StoryObj = {
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
