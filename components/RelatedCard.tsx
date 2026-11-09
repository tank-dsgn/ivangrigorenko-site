import type { CSSProperties } from "react";
import Link from "next/link";
import CardImage, { type CardImageData } from "@/components/CardImage";

export type RelatedCardSize = "mobile" | "tablet" | "desktop";

/**
 * The small project card from the "See also" block at the end of a case.
 *
 * In the design file this is "Card-projects-small": a window with an image and
 * a caption under it. `size` picks the size; the page renders all three and
 * shows the one that fits the window. Pages call the component from the
 * generated markup (tools/figma/emit.mjs, relatedCard).
 *
 * Only the desktop card has a hover: window and caption lift 6px, the window's
 * shadow thickens and takes an indigo cast, the image grows a little, and the
 * caption turns indigo and semibold (600). All of it over 300 ms.
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
  /** the caption under the image */
  label: string;
  image: CardImageData;
  /** how the window differs from the usual one: in the design file some cards have it 1–3px shorter */
  frame?: CSSProperties;
}) {
  const window_ = "bg-thumb shadow-thumb relative shrink-0 overflow-hidden";
  const text = "text-body w-min min-w-full self-stretch text-center font-normal whitespace-pre-line uppercase";

  if (size === "desktop") {
    return (
      // 6px of room above: that is where the window lifts to on hover
      <Link href={href} className="press-soft group flex h-[321px] w-[304px] shrink-0 flex-col items-start gap-3 pt-1.5">
        <div
          className={`${window_} ease-figma group-hover:shadow-thumb-hover h-[283px] w-[304px] rounded-3xl transition-[translate,box-shadow] duration-300 group-hover:-translate-y-1.5`}
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
