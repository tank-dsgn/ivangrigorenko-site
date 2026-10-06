import Link from "next/link";

/**
 * Кнопка сайта — контурная, 40px: «Скачать моё резюме», «Посетить сайт», «Открыть прототип».
 *
 * В макете это компонент «Button» (Type=outlined). Страницы вызывают её из
 * сгенерированной вёрстки (tools/figma/emit.mjs, siteButton).
 * При наведении обводка и текст становятся индиго за 300 мс.
 *
 * Крупная кнопка первого экрана с бегущей обводкой — отдельный компонент ContactButton.
 */
export default function Button({
  href,
  label,
  newTab,
  width,
  wideLabel,
}: {
  href: string;
  label: string;
  /** открыть в новой вкладке — для внешних ссылок */
  newTab?: boolean;
  /** ширина: по тексту (по умолчанию), "fill" — на всю ширину блока, либо точное значение ("335px") */
  width?: string;
  /** подпись занимает всю кнопку и стоит слева — так в макете у «Посетить сайт» на узких экранах */
  wideLabel?: boolean;
}) {
  const wide = Boolean(width);
  const className = `group flex flex-row items-start ${width === "fill" ? "self-stretch" : ""}`;
  const style = width && width !== "fill" ? { width } : undefined;
  const body = (
    <div
      className={`ease-figma flex h-10 flex-row items-center justify-center gap-2 rounded-full bg-white px-4 py-2 shadow-[inset_0_0_0_1px_#94a3b8] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_1px_#4f46e5] group-focus-visible:shadow-[inset_0_0_0_1px_#4f46e5] ${wide ? "min-w-px flex-[1_0_0px]" : ""}`}
    >
      <p
        className={`text-muted ease-figma group-hover:text-accent group-focus-visible:text-accent text-[16px] leading-6 font-semibold transition-colors duration-300 ${wideLabel ? "min-w-px flex-[1_0_0px]" : "whitespace-nowrap"}`}
      >
        {label}
      </p>
    </div>
  );

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} className={className} style={style} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  );
}
