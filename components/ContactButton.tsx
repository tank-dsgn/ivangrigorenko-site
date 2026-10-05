import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной»: прокручивает к блоку контактов внизу страницы.
 * Стоит в первом экране главной.
 * В оригинале её нет (добавлена 2026-10-05), в страницы её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 * Вид — контурная кнопка из макета (как «Скачать моё резюме»): при наведении
 * обводка и текст становятся индиго.
 */
export default function ContactButton({ lang, full }: { lang: Lang; /** на всю ширину блока */ full?: boolean }) {
  return (
    <a
      href="#contacts"
      // те же цвета, что у кнопки «Скачать моё резюме»; поля шире — 24px вместо 16
      className={`text-muted h-10 items-center justify-center rounded-full bg-white px-6 text-[16px] leading-6 font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_#94a3b8] hover:text-accent hover:shadow-[inset_0_0_0_1px_#4f46e5] ${full ? "flex w-full" : "inline-flex"}`}
    >
      {label[lang]}
    </a>
  );
}
