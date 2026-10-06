import { useRef, type CSSProperties, type MouseEvent } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ContactButton from "@/components/ContactButton";

// Черновик для выбора: три разных поведения кнопки первого экрана при наведении.
// На сайте пока стоит четвёртый вариант («Now»). Выбранное уйдёт в components/ContactButton.tsx,
// этот файл после выбора можно удалить.

const base =
  "relative inline-flex h-12 items-center justify-center rounded-full px-10 text-[18px] leading-7 font-semibold whitespace-nowrap";

/** Положение курсора внутри кнопки — в CSS-переменные --x и --y */
function usePointer() {
  const ref = useRef<HTMLAnchorElement>(null);
  const track = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return { ref, track };
}
const stay = (e: MouseEvent) => e.preventDefault();

/** A. Заливка из точки, где курсор вошёл в кнопку; уходит туда, где он вышел */
function FillFromCursor({ label }: { label: string }) {
  const { ref, track } = usePointer();
  return (
    <a
      ref={ref}
      href="#contacts"
      onClick={stay}
      onMouseEnter={track}
      onMouseLeave={track}
      className={`${base} group text-muted ease-figma overflow-hidden bg-white shadow-[inset_0_0_0_1px_#94a3b8] transition-colors duration-300 hover:text-white focus-visible:text-white`}
    >
      <span
        aria-hidden="true"
        className="bg-accent ease-figma pointer-events-none absolute aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full transition-transform duration-500 group-hover:scale-100 group-focus-visible:scale-100"
        style={{ left: "var(--x, 50%)", top: "var(--y, 50%)" }}
      />
      <span className="relative">{label}</span>
    </a>
  );
}

/** B. Буквы по очереди уезжают вверх, снизу приезжают такие же индиго */
function TextRoll({ label }: { label: string }) {
  return (
    <a
      href="#contacts"
      onClick={stay}
      aria-label={label}
      className={`${base} group text-muted ease-figma bg-white shadow-[inset_0_0_0_1px_#94a3b8] transition-[box-shadow,background-color] duration-300 hover:bg-[#f5f5ff] hover:shadow-[inset_0_0_0_1.5px_#4f46e5]`}
    >
      <span aria-hidden="true" className="flex overflow-hidden">
        {[...label].map((char, i) => (
          <span
            key={i}
            className="ease-figma relative block whitespace-pre transition-transform duration-300 group-hover:-translate-y-full"
            style={{ transitionDelay: `${i * 14}ms` }}
          >
            {char}
            <span className="text-accent absolute top-full left-0">{char}</span>
          </span>
        ))}
      </span>
    </a>
  );
}

/** C. Пятно света и подсветка обводки идут за курсором */
function Spotlight({ label }: { label: string }) {
  const { ref, track } = usePointer();
  const ring: CSSProperties = {
    padding: "1.5px",
    background: "radial-gradient(110px circle at var(--x, 50%) var(--y, 50%), #4f46e5, #a5b4fc 55%, #cbd5e1 100%)",
    mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
  };
  return (
    <a
      ref={ref}
      href="#contacts"
      onClick={stay}
      onMouseEnter={track}
      onMouseMove={track}
      className={`${base} group text-muted ease-figma hover:text-accent bg-white transition-colors duration-300`}
    >
      <span aria-hidden="true" className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_#94a3b8]" />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(90px circle at var(--x, 50%) var(--y, 50%), rgba(79, 70, 229, 0.16), transparent 75%)" }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={ring}
      />
      <span className="relative">{label}</span>
    </a>
  );
}

const labels = ["Связаться", "Написать мне", "Поговорим", "Обсудить проект", "Contact me", "Get in touch", "Let’s talk"];
type Args = { label: string };

const meta: Meta<Args> = {
  title: "Explorations/Contact button hover",
  args: { label: "Написать мне" },
  argTypes: { label: { name: "Label", control: "select", options: labels } },
  parameters: { layout: "padded" },
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
      <div className="flex h-24 items-center">{children}</div>
    </div>
  );
}

export const Compare: Story = {
  render: ({ label }) => (
    <div className="flex flex-row flex-wrap gap-x-12 gap-y-8">
      <Option name="A — Fill from cursor" note="Indigo floods in from the point where the cursor entered and drains toward where it leaves.">
        <FillFromCursor label={label} />
      </Option>
      <Option name="B — Text roll" note="Letters roll up one by one and come back in indigo. The outline turns indigo, nothing loops.">
        <TextRoll label={label} />
      </Option>
      <Option name="C — Spotlight" note="A soft light and an outline highlight follow the cursor inside the button.">
        <Spotlight label={label} />
      </Option>
      <Option name="Now — on the site" note="Indigo outline, glow ring and a segment running around it.">
        <ContactButton lang={/[а-яё]/i.test(label) ? "ru" : "en"} />
      </Option>
    </div>
  ),
};

export const A_FillFromCursor: Story = { name: "A — Fill from cursor", render: ({ label }) => <FillFromCursor label={label} /> };
export const B_TextRoll: Story = { name: "B — Text roll", render: ({ label }) => <TextRoll label={label} /> };
export const C_Spotlight: Story = { name: "C — Spotlight", render: ({ label }) => <Spotlight label={label} /> };
