import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной»: прокручивает к блоку контактов внизу страницы.
 * Стоит в первом экране главной и рядом с кнопкой резюме на «Обо мне».
 * В оригинале её нет (добавлена 2026-10-05), в страницы её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 * Вид — основная кнопка из макета: индиго, 40px, скругление в пилюлю.
 */
export default function ContactButton({ lang, full }: { lang: Lang; /** на всю ширину — в столбике на телефоне */ full?: boolean }) {
  return (
    <a
      href="#contacts"
      className={`bg-accent ease-figma h-10 items-center justify-center rounded-full px-4 text-[16px] leading-6 font-semibold whitespace-nowrap text-white transition-colors duration-200 hover:bg-[#4338ca] ${full ? "flex w-full" : "inline-flex"}`}
    >
      {label[lang]}
    </a>
  );
}
