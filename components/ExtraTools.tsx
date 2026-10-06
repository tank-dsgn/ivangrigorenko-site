/**
 * Четвёртый ряд сетки «Мои инструменты» на странице «Обо мне»: Storybook, GitHub, Vercel.
 *
 * В макете этих иконок нет — Иван попросил добавить их 2026-10-06, остальные не трогать.
 * Ряд вставляет генератор (`additions` в tools/figma/overrides.json) после трёх рядов
 * из макета; размер и шаг те же: иконка 34px, между иконками 20px.
 */
const tools = [
  { name: "Storybook", src: "/icons/tools/storybook.svg" },
  { name: "GitHub", src: "/icons/tools/github.svg" },
  { name: "Vercel", src: "/icons/tools/vercel.svg" },
];

export default function ExtraTools() {
  return (
    <div className="flex flex-row items-start gap-5">
      {tools.map((tool) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tool.name}
          src={tool.src}
          alt=""
          title={tool.name}
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="h-[34px] w-[34px] shrink-0"
        />
      ))}
    </div>
  );
}
