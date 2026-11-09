import type { CSSProperties } from "react";

export type CardImageData = {
  /** the image file */
  src: string;
  /** where the image sits inside the card window; taken from the design file, different per project and size */
  style: CSSProperties;
  /** hover, desktop only: how far the image shifts and how much it grows */
  hover?: { translate?: string; scale?: string };
};

/**
 * The image inside a card window, shared by the project card and the "See also" card.
 *
 * It is placed by the coordinates from the design file. While the cursor is on
 * the card — an ancestor carries the `group` class — it eases into the shift
 * and the growth given by `hover`.
 */
export default function CardImage({ image }: { image: CardImageData }) {
  // the −50% shift that centres the image and the hover scale share one
  // transform; otherwise the scale would drag the image sideways
  const { transform, ...position } = image.style;
  return (
    <div
      className="ease-figma [transform:var(--img-base,none)] bg-cover bg-center bg-no-repeat transition-[translate,transform] duration-300 group-hover:[transform:var(--img-zoom,var(--img-base,none))] group-hover:[translate:var(--img-shift,0px_0px)]"
      style={
        {
          ...position,
          backgroundImage: `url(${image.src})`,
          "--img-base": transform,
          "--img-zoom": image.hover?.scale
            ? `${transform ?? ""} scale(${image.hover.scale})`.trim()
            : undefined,
          "--img-shift": image.hover?.translate,
        } as CSSProperties
      }
    />
  );
}
