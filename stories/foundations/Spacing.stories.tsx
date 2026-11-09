import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// The spacing scale: these values and no others. Anything not a multiple of 4, apart from 2 and 6, is a mistake.
const scale = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];

const breakpoints = [
  { name: "Mobile", range: "up to 799px", frame: 375, prefix: "no prefix", side: 20 },
  { name: "Tablet", range: "800–1279px", frame: 800, prefix: "md:", side: 40 },
  { name: "Desktop", range: "1280px and up", frame: 1280, prefix: "xl:", side: 56 },
];

const meta: Meta = {
  title: "Foundations/Spacing",
  parameters: { layout: "padded", controls: { disable: true } },
};
export default meta;

export const Scale: StoryObj = {
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

export const Breakpoints: StoryObj = {
  render: () => (
    <table className="text-body border-separate border-spacing-x-6 border-spacing-y-2 text-left text-[14px] leading-5">
      <thead className="text-muted text-[12px] leading-4 uppercase">
        <tr>
          <th className="font-normal">Screen</th>
          <th className="font-normal">Window width</th>
          <th className="font-normal">Mockup frame</th>
          <th className="font-normal">Tailwind prefix</th>
          <th className="font-normal">Header side padding</th>
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
