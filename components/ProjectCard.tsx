import type { CSSProperties } from "react";
import Link from "next/link";
import CardImage, { type CardImageData } from "@/components/CardImage";

export type ProjectCardSize = "mobile" | "tablet" | "desktop";

export type ProjectCardImage = CardImageData & {
  /** quirks of the image window: the aspect ratio on a phone, the ground, the corner radius */
  frame?: CSSProperties;
};

/**
 * A project card on the home page.
 *
 * In the design file this is "Card - Project Preview" in three sizes, one per
 * breakpoint. It works the same way here: `size` picks the size, the page
 * renders all three and shows the one that fits the window. The card's styling
 * lives in the classes below, so a change here lands both on the site and in
 * Storybook.
 *
 * Pages call the component from the generated markup; the generator takes the
 * link, the text and the image from the design file (tools/figma/emit.mjs,
 * projectCard).
 *
 * Only the desktop card has a hover: it lifts 6px, the shadow thickens and
 * takes an indigo cast, and the image grows a little. The background stays
 * white. All of it over 300 ms.
 */
export default function ProjectCard({
  size,
  href,
  tags,
  title,
  description,
  image,
}: {
  size: ProjectCardSize;
  href: string;
  /** the line above the title: field, kind of work */
  tags: string;
  title: string;
  description: string;
  image: ProjectCardImage;
}) {
  const picture = <CardImage image={image} />;

  // pre-line: a line break typed into the text by hand is kept
  const tagsText = "text-muted w-min min-w-full self-stretch font-normal whitespace-pre-line uppercase";
  const titleText = "text-ink w-min min-w-full self-stretch font-semibold whitespace-pre-line";
  const descriptionText = "text-body w-min min-w-full self-stretch font-normal whitespace-pre-line";

  if (size === "mobile") {
    return (
      <Link
        href={href}
        className="press-soft shadow-card flex flex-col items-start gap-4 self-stretch overflow-hidden rounded-xl bg-white pb-10"
      >
        <div className="relative self-stretch overflow-hidden" style={image.frame}>
          {picture}
        </div>
        <div className="flex flex-col items-start gap-2 self-stretch overflow-hidden px-5">
          <p className={`${tagsText} text-[12px] leading-4`}>{tags}</p>
          <div className="flex flex-col items-start gap-2 self-stretch">
            <p className={`${titleText} text-[20px] leading-7`}>{title}</p>
            <p className={`${descriptionText} text-[16px] leading-6`}>{description}</p>
          </div>
        </div>
      </Link>
    );
  }

  if (size === "tablet") {
    return (
      <Link
        href={href}
        className="press-soft shadow-card flex h-[320px] w-[720px] shrink-0 flex-row items-start gap-6 overflow-hidden rounded-2xl bg-white pr-6"
      >
        <div className="relative h-[320px] w-[384px] shrink-0 overflow-hidden" style={image.frame}>
          {picture}
        </div>
        <div className="flex min-w-px flex-[1_0_0px] flex-col items-start gap-2 overflow-hidden py-6">
          <p className={`${tagsText} text-[12px] leading-4`}>{tags}</p>
          <div className="flex flex-col items-start gap-3 self-stretch">
            <p className={`${titleText} text-[24px] leading-8`}>{title}</p>
            <p className={`${descriptionText} text-[16px] leading-6`}>{description}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    // The link matches the card exactly. In the design file it sat 6px higher,
    // leaving room for the hover lift; that room was removed on 2026-10-09 so
    // the gaps between cards are exactly the ones specified — the card lifts by
    // a transform and needs no space in the layout for it.
    <Link href={href} className="press-soft group flex h-[400px] w-[920px] shrink-0 flex-col items-start">
      <div className="shadow-card ease-figma group-hover:shadow-card-hover flex h-[400px] shrink-0 flex-row items-center justify-between self-stretch overflow-hidden rounded-3xl bg-white transition-[translate,box-shadow] duration-300 group-hover:-translate-y-1.5">
        <div className="relative h-[400px] w-[548px] shrink-0 overflow-hidden" style={image.frame}>
          {picture}
        </div>
        <div className="flex h-[400px] w-[372px] shrink-0 flex-col items-start justify-between overflow-hidden p-6">
          <div className="flex flex-col items-start gap-3 self-stretch">
            <p className={`${tagsText} text-[14px] leading-5`}>{tags}</p>
            <div className="flex flex-col items-start gap-4 self-stretch">
              <p className={`${titleText} text-[30px] leading-9`}>{title}</p>
              <p className={`${descriptionText} text-[18px] leading-7`}>{description}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
