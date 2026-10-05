import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка в первом экране главной: прокручивает к блоку «Свяжитесь со мной» внизу.
 * В оригинале её нет (добавлена 2026-10-05), в страницу её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 * Вид — основная кнопка из макета: индиго, 40px, скругление в пилюлю.
 */
export default function ContactButton({ lang }: { lang: Lang }) {
  return (
    <a
      href="#contacts"
      className="bg-accent ease-figma inline-flex h-10 items-center rounded-full px-4 text-[16px] leading-6 font-semibold whitespace-nowrap text-white transition-colors duration-200 hover:bg-[#4338ca]"
    >
      {label[lang]}
    </a>
  );
}
