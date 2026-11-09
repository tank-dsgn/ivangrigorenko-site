/**
 * The fourth row of the "My tools" grid on the About page: Storybook, GitHub, Vercel, Tailwind CSS.
 *
 * The design file has none of these icons; Ivan asked for them on 2026-10-06
 * and for the rest to be left alone. The generator inserts the row
 * (`additions` in tools/figma/overrides.json) after the three rows that come
 * from the design file, at the same size and pitch: 34px icons, 20px apart.
 */
const tools = [
  { name: "Storybook", src: "/icons/tools/storybook.svg" },
  { name: "GitHub", src: "/icons/tools/github.svg" },
  { name: "Vercel", src: "/icons/tools/vercel.svg" },
  { name: "Tailwind CSS", src: "/icons/tools/tailwind.svg" },
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
