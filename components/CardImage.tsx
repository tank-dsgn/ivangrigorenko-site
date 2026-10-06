import type { CSSProperties } from "react";

export type CardImageData = {
  /** файл картинки */
  src: string;
  /** положение картинки в окне карточки — из макета, у каждого проекта и размера своё */
  style: CSSProperties;
  /** наведение (десктоп): на сколько картинка сдвигается и во сколько раз растёт */
  hover?: { translate?: string; scale?: string };
};

/**
 * Картинка в окне карточки — общая для карточки проекта и карточки «Смотрите также».
 *
 * Стоит в окне по координатам из макета. Когда курсор на карточке (у предка класс
 * `group`), плавно сдвигается и увеличивается на величину из `hover`.
 */
export default function CardImage({ image }: { image: CardImageData }) {
  // сдвиг на −50% для привязки по центру и увеличение при наведении делят один transform,
  // иначе увеличение увело бы картинку в сторону
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
