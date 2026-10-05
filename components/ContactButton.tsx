import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной»: прокручивает к блоку контактов внизу страницы.
 * Стоит в первом экране главной, под заголовком, по левому краю текста.
 * В оригинале её нет (добавлена 2026-10-05), в страницу её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 *
 * Вид — контурная кнопка из макета (как «Скачать моё резюме»), но крупнее:
 * 48px в высоту, текст 18px, поля 40px; на телефоне — 40px, 16px и 32px.
 * При наведении кнопка выделяется целиком: обводка и текст становятся индиго,
 * вокруг появляется мягкое индиго-свечение. Всё плавно, за 300 мс.
 */
export default function ContactButton({ lang }: { lang: Lang }) {
  return (
    <a
      href="#contacts"
      // тень из трёх слоёв: обводка, кольцо свечения, мягкая тень снизу; в покое два последних прозрачны
      className="text-muted ease-figma hover:text-accent focus-visible:text-accent inline-flex h-10 items-center justify-center rounded-full bg-white px-8 text-[16px] leading-6 font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_#94a3b8,0_0_0_0_rgba(79,70,229,0),0_8px_24px_-8px_rgba(79,70,229,0)] transition-[color,box-shadow] duration-300 hover:shadow-[inset_0_0_0_2px_#4f46e5,0_0_0_4px_rgba(79,70,229,0.12),0_8px_24px_-8px_rgba(79,70,229,0.45)] focus-visible:shadow-[inset_0_0_0_2px_#4f46e5,0_0_0_4px_rgba(79,70,229,0.12),0_8px_24px_-8px_rgba(79,70,229,0.45)] motion-reduce:transition-none md:h-12 md:px-10 md:text-[18px] md:leading-7"
    >
      {label[lang]}
    </a>
  );
}
