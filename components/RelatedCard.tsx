import type { CSSProperties } from "react";
import Link from "next/link";
import CardImage, { type CardImageData } from "@/components/CardImage";

export type RelatedCardSize = "mobile" | "tablet" | "desktop";

/**
 * Маленькая карточка проекта из блока «Смотрите также» в конце кейса.
 *
 * В макете это компонент «Card-projects-small»: окно с картинкой и подпись под ним.
 * Размер задаёт `size` — страница выводит все три и показывает нужный по ширине окна.
 * Страницы вызывают компонент из сгенерированной вёрстки (tools/figma/emit.mjs, relatedCard).
 *
 * Наведение есть только у десктопной: окно и подпись поднимаются на 6px, у окна
 * плотнее тень, картинка слегка растёт, подпись становится индиго и полужирной (600). Всё за 300 мс.
 */
export default function RelatedCard({
  size,
  href,
  label,
  image,
  frame,
}: {
  size: RelatedCardSize;
  href: string;
  /** подпись под картинкой */
  label: string;
  image: CardImageData;
  /** отличия окна от обычного: в макете у части карточек оно на 1–3px ниже */
  frame?: CSSProperties;
}) {
  const window_ = "bg-thumb shadow-thumb relative shrink-0 overflow-hidden";
  const text = "text-body w-min min-w-full self-stretch text-center font-normal whitespace-pre-line uppercase";

  if (size === "desktop") {
    return (
      // сверху 6px запаса: туда окно поднимается при наведении
      <Link href={href} className="press-soft group flex h-[321px] w-[304px] shrink-0 flex-col items-start gap-3 pt-1.5">
        <div
          className={`${window_} ease-figma group-hover:shadow-card-hover h-[283px] w-[304px] rounded-3xl transition-[translate,box-shadow] duration-300 group-hover:-translate-y-1.5`}
          style={frame}
        >
          <CardImage image={image} />
        </div>
        <p
          className={`${text} ease-figma group-hover:text-accent text-[14px] leading-5 transition-[translate,color,font-weight] duration-300 group-hover:-translate-y-1.5 group-hover:font-semibold`}
        >
          {label}
        </p>
      </Link>
    );
  }

  return (
    <Link href={href} className="press-soft flex w-[300px] shrink-0 flex-col items-start gap-2">
      <div
        className={`${window_} h-[280px] self-stretch ${size === "tablet" ? "rounded-2xl" : "rounded-xl"}`}
        style={frame}
      >
        <CardImage image={image} />
      </div>
      <p className={`${text} text-[12px] leading-4`}>{label}</p>
    </Link>
  );
}
