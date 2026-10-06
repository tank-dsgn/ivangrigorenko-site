import type { CSSProperties, MouseEvent } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ContactButton from "@/components/ContactButton";

// Черновик для выбора: варианты в духе того, что уже стоит на сайте — индиго-обводка
// и свет вокруг кнопки. Выбранное уйдёт в components/ContactButton.tsx, файл можно удалить.

const css = `
@keyframes glow-comet { from { stroke-dashoffset: var(--l); } to { stroke-dashoffset: calc(var(--l) - 1); } }
@property --glow-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes glow-spin { to { --glow-angle: 360deg; } }
@keyframes glow-ping { from { opacity: 0.45; transform: scale(1); } to { opacity: 0; transform: scale(1.22, 1.6); } }
.glow-comet rect { opacity: 0; transition: opacity 300ms; }
.group:hover .glow-comet rect { opacity: 1; animation: glow-comet 3.6s linear infinite; }
.glow-draw rect { stroke-dasharray: 1 1; stroke-dashoffset: 1; transition: stroke-dashoffset 700ms cubic-bezier(0.3, 0, 0.2, 1); }
.group:hover .glow-draw rect { stroke-dashoffset: 0; }
.glow-aura { opacity: 0; transition: opacity 400ms; background: conic-gradient(from var(--glow-angle), #4f46e5, #a5b4fc, #eef2ff, #818cf8, #4f46e5); animation: glow-spin 5s linear infinite; }
.group:hover .glow-aura { opacity: 1; }
.group:hover .glow-ping { animation: glow-ping 900ms cubic-bezier(0, 0, 0.3, 1) 1; }
`;

const base =
  "group relative inline-flex h-12 items-center justify-center rounded-full px-10 text-[18px] leading-7 font-semibold whitespace-nowrap text-muted ease-figma transition-colors duration-300 hover:text-accent";
// обводка: серая 1px, под курсором индиго 2px — как сейчас на сайте
const face =
  "absolute inset-0 rounded-full bg-white ease-figma shadow-[inset_0_0_0_1px_#94a3b8] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_2px_#4f46e5]";
const stay = (e: MouseEvent) => e.preventDefault();

// рамка по середине кольца в 4px снаружи кнопки
const ring = "pointer-events-none absolute -inset-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] overflow-visible";

/** D. Комета: тот же бегунок в кольце, но с мягким затухающим хвостом */
function Comet({ label }: { label: string }) {
  // слои одной длины головы: чем длиннее штрих, тем он прозрачнее — получается хвост
  const tail = Array.from({ length: 12 }, (_, i) => ({ l: 0.04 + i * 0.03, o: 0.045 }));
  return (
    <a href="#contacts" onClick={stay} className={base}>
      <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_0_4px_rgba(79,70,229,0.1)] transition-opacity duration-300 group-hover:opacity-100" />
      <span aria-hidden="true" className={face} />
      <svg aria-hidden="true" className={`glow-comet ${ring}`} fill="none" strokeWidth="4" strokeLinecap="round">
        {tail.map((t) => (
          <rect key={t.l} width="100%" height="100%" rx="26" stroke="#4f46e5" strokeOpacity={t.o} pathLength={1} strokeDasharray={`${t.l} ${1 - t.l}`} style={{ "--l": t.l } as CSSProperties} />
        ))}
      </svg>
      <span className="relative">{label}</span>
    </a>
  );
}

/** E. Кольцо рисуется один раз вокруг кнопки и остаётся; уходит обратно, когда курсор ушёл */
function DrawOnce({ label }: { label: string }) {
  return (
    <a href="#contacts" onClick={stay} className={base}>
      <span aria-hidden="true" className={face} />
      <svg aria-hidden="true" className={`glow-draw ${ring}`} fill="none" strokeWidth="4" strokeLinecap="round">
        <rect width="100%" height="100%" rx="26" stroke="#4f46e5" strokeOpacity="0.22" pathLength={1} />
      </svg>
      <span className="relative">{label}</span>
    </a>
  );
}

/** F. Ореол: мягкое свечение вокруг кнопки медленно переливается оттенками индиго */
function Aura({ label }: { label: string }) {
  return (
    <a href="#contacts" onClick={stay} className={base}>
      <span aria-hidden="true" className="glow-aura absolute -inset-1 rounded-full blur-[6px]" />
      <span aria-hidden="true" className={face} />
      <span className="relative">{label}</span>
    </a>
  );
}

/** G. Волна: кольцо один раз расходится от кнопки и гаснет */
function Ping({ label }: { label: string }) {
  return (
    <a href="#contacts" onClick={stay} className={base}>
      <span aria-hidden="true" className="glow-ping absolute inset-0 rounded-full opacity-0 shadow-[0_0_0_3px_#4f46e5]" />
      <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_0_4px_rgba(79,70,229,0.12)] transition-opacity duration-300 group-hover:opacity-100" />
      <span aria-hidden="true" className={face} />
      <span className="relative">{label}</span>
    </a>
  );
}

const labels = ["Связаться", "Написать мне", "Поговорим", "Обсудить проект", "Contact me", "Get in touch", "Let’s talk"];
type Args = { label: string };

const meta: Meta<Args> = {
  title: "Explorations/Contact button glow",
  args: { label: "Связаться" },
  argTypes: { label: { name: "Label", control: "select", options: labels } },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <>
        <style>{css}</style>
        <Story />
      </>
    ),
  ],
};
export default meta;
type Story = StoryObj<Args>;

function Option({ name, note, children }: { name: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex w-[300px] flex-col items-start gap-4">
      <div>
        <div className="text-ink text-[16px] leading-6 font-semibold">{name}</div>
        <div className="text-body text-[14px] leading-5">{note}</div>
      </div>
      <div className="flex h-24 items-center pl-2">{children}</div>
    </div>
  );
}

export const Compare: Story = {
  render: ({ label }) => (
    <div className="flex flex-row flex-wrap gap-x-12 gap-y-8">
      <Option name="Now — on the site" note="Indigo outline, glow ring, soft shadow and a solid segment running around the ring.">
        <ContactButton lang={/[а-яё]/i.test(label) ? "ru" : "en"} />
      </Option>
      <Option name="D — Comet" note="Same idea, but the runner is a light with a fading tail instead of a solid dash. Slower, no drop shadow.">
        <Comet label={label} />
      </Option>
      <Option name="E — Draw once" note="The ring draws itself around the button once and stays. It retracts when the cursor leaves. Nothing loops.">
        <DrawOnce label={label} />
      </Option>
      <Option name="F — Aura" note="A soft halo around the button slowly shifts between indigo tints. No runner at all.">
        <Aura label={label} />
      </Option>
      <Option name="G — Ping" note="One ring expands from the button and fades, then a quiet glow ring stays.">
        <Ping label={label} />
      </Option>
    </div>
  ),
};

export const D_Comet: Story = { name: "D — Comet", render: ({ label }) => <Comet label={label} /> };
export const E_DrawOnce: Story = { name: "E — Draw once", render: ({ label }) => <DrawOnce label={label} /> };
export const F_Aura: Story = { name: "F — Aura", render: ({ label }) => <Aura label={label} /> };
export const G_Ping: Story = { name: "G — Ping", render: ({ label }) => <Ping label={label} /> };
