import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// The text styles that actually occur on the pages, counted from the markup
// generated out of the design file. One typeface, Open Sans, in 400 / 600 / 700.
const styles = [
  { size: 48, line: 48, weight: 700, use: "Large figures in case studies" },
  { size: 36, line: 40, weight: 700, use: "Page title and case section heading (desktop)" },
  { size: 30, line: 36, weight: 700, use: "Section heading (tablet)" },
  { size: 30, line: 36, weight: 600, use: "Project card title, contact block title (desktop)" },
  { size: 24, line: 32, weight: 700, use: "Subheadings in case studies" },
  { size: 24, line: 32, weight: 600, use: "Project card title (tablet)" },
  { size: 20, line: 28, weight: 600, use: "Project card title (mobile)" },
  { size: 20, line: 28, weight: 400, use: "Body text of case studies and About (desktop)" },
  { size: 18, line: 28, weight: 600, use: "Contact button (desktop)" },
  { size: 18, line: 28, weight: 400, use: "Project card description (desktop)" },
  { size: 16, line: 24, weight: 600, use: "Navigation, buttons" },
  { size: 16, line: 24, weight: 400, use: "Body text (tablet and mobile)" },
  { size: 14, line: 20, weight: 400, use: "Project card tags (desktop), captions" },
  { size: 12, line: 16, weight: 600, use: "Small headings in tables and diagrams" },
  { size: 12, line: 16, weight: 400, use: "Project card tags (tablet, mobile), diagram captions" },
];

const meta: Meta<{ sample: string }> = {
  title: "Foundations/Typography",
  parameters: { layout: "padded" },
  args: { sample: "Fast and intuitive crypto exchange" },
  argTypes: { sample: { name: "Sample text", control: "text" } },
};
export default meta;

export const Scale: StoryObj<{ sample: string }> = {
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
