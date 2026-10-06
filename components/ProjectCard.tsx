import type { CSSProperties } from "react";
import Link from "next/link";

export type ProjectCardSize = "mobile" | "tablet" | "desktop";

export type ProjectCardImage = {
  /** файл картинки */
  src: string;
  /** положение картинки в окне карточки — из макета, у каждого проекта и размера своё */
  style: CSSProperties;
  /** особенности окна под картинку: пропорция на телефоне, подложка, скругление */
  frame?: CSSProperties;
  /** наведение (десктоп): на сколько картинка сдвигается и во сколько раз растёт */
  hover?: { translate?: string; scale?: string };
};

/**
 * Карточка проекта на главной.
 *
 * В макете это компонент «Card - Project Preview» в трёх размерах — по одному на
 * брейкпоинт. Здесь то же самое: размер задаёт `size`, страница выводит все три
 * и показывает нужный по ширине окна. Оформление карточки — в классах ниже; меняете
 * здесь — меняется и на сайте, и в Storybook.
 *
 * Страницы вызывают компонент из сгенерированной вёрстки: ссылку, тексты и картинку
 * генератор берёт из макета (tools/figma/emit.mjs, projectCard).
 *
 * Наведение есть только у десктопной карточки: она поднимается на 6px, тень
 * становится плотнее, картинка слегка увеличивается. Всё за 300 мс.
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
  /** строка над названием: область, тип работы */
  tags: string;
  title: string;
  description: string;
  image: ProjectCardImage;
}) {
  // сдвиг на −50% для привязки по центру и увеличение при наведении делят один transform,
  // иначе увеличение увело бы картинку в сторону
  const { transform, ...position } = image.style;
  const picture = (
    <div
      className="ease-figma [transform:var(--pc-base,none)] bg-cover bg-center bg-no-repeat transition-[translate,transform] duration-300 group-hover:[transform:var(--pc-zoom,var(--pc-base,none))] group-hover:[translate:var(--pc-shift,0px_0px)]"
      style={
        {
          ...position,
          backgroundImage: `url(${image.src})`,
          "--pc-base": transform,
          "--pc-zoom": image.hover?.scale
            ? `${transform ?? ""} scale(${image.hover.scale})`.trim()
            : undefined,
          "--pc-shift": image.hover?.translate,
        } as CSSProperties
      }
    />
  );

  // pre-line: перенос строки, поставленный в тексте вручную, сохраняется
  const tagsText = "text-muted w-min min-w-full self-stretch font-normal whitespace-pre-line uppercase";
  const titleText = "text-ink w-min min-w-full self-stretch font-semibold whitespace-pre-line";
  const descriptionText = "text-body w-min min-w-full self-stretch font-normal whitespace-pre-line";

  if (size === "mobile") {
    return (
      <Link
        href={href}
        className="shadow-card flex flex-col items-start gap-4 self-stretch overflow-hidden rounded-xl bg-white pb-10"
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
        className="shadow-card flex h-[320px] w-[720px] shrink-0 flex-row items-start gap-6 overflow-hidden rounded-2xl bg-white pr-6"
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
    // ссылка на 6px выше карточки: это место, куда карточка поднимается при наведении
    <Link href={href} className="group flex h-[406px] w-[920px] shrink-0 flex-col items-start justify-end">
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
