import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

type Args = { duration: number; easing: string; lift: number };

const meta: Meta<Args> = {
  title: "Основы/Движение",
  parameters: { layout: "padded", backgrounds: { value: "page" } },
  args: { duration: 300, easing: "cubic-bezier(0, 0, 0.58, 1)", lift: 6 },
  argTypes: {
    duration: { name: "Длительность, мс", control: { type: "range", min: 0, max: 1000, step: 50 } },
    easing: {
      name: "Кривая",
      control: "select",
      options: ["cubic-bezier(0, 0, 0.58, 1)", "ease", "ease-in-out", "linear", "cubic-bezier(0.2, 0.8, 0.2, 1)"],
    },
    lift: { name: "Подъём карточки, px", control: { type: "range", min: 0, max: 16, step: 2 } },
  },
};
export default meta;

/**
 * На сайте одно движение на всё: 300 мс, кривая ease-out из Figma (`ease-figma`).
 * Так поднимаются карточки, едут карусели, меняется цвет кнопок. Цвет ссылок — 200 мс.
 */
export const Переход: StoryObj<Args> = {
  render: ({ duration, easing, lift }) => {
    const [on, setOn] = useState(false);
    return (
      <div className="flex flex-col items-start gap-8">
        <p className="text-body max-w-xl text-[14px] leading-5">
          Наведите на карточку или нажмите кнопку. Значения справа внизу меняют переход только в
          этом примере; на сайте он задан токеном <code>--ease-figma</code> и длительностью 300 мс.
        </p>
        <div
          className="h-40 w-72 rounded-3xl bg-white"
          onMouseEnter={() => setOn(true)}
          onMouseLeave={() => setOn(false)}
          style={{
            transition: `translate ${duration}ms ${easing}, box-shadow ${duration}ms ${easing}`,
            translate: on ? `0 -${lift}px` : "0 0",
            boxShadow: on ? "0 8px 24px 0 rgba(64, 62, 92, 0.3)" : "0 8px 20px 0 rgba(0, 0, 0, 0.1)",
          }}
        />
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className="text-muted h-10 rounded-full bg-white px-4 text-[16px] leading-6 font-semibold shadow-[inset_0_0_0_1px_#94a3b8]"
        >
          {on ? "Опустить" : "Поднять"}
        </button>
      </div>
    );
  },
};
