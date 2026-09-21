import Image from "next/image";
import { aboutContent, badges, portrait, tools } from "@/lib/content/about";
import type { Lang } from "@/lib/site";

export default function About({ lang }: { lang: Lang }) {
  const c = aboutContent[lang];

  return (
    <section className="bg-[#fafaf9] px-5 pt-6 pb-10 md:px-10 md:pt-10 xl:px-30 xl:pt-18 xl:pb-18">
      <div className="mx-auto w-full max-w-[350px] md:max-w-[805px] xl:max-w-[960px]">
        <h1 className="text-ink text-[24px] leading-8 font-bold xl:text-[30px] xl:leading-9">
          {c.heading}
        </h1>

        <div className="mt-2 flex flex-col md:mt-3 md:flex-row md:gap-8 xl:mt-6 xl:gap-12">
          {/* Текст */}
          <div className="flex flex-col md:w-[509px] md:shrink-0 xl:w-[582px]">
            <div className="flex flex-col gap-2 md:gap-3 xl:gap-5">
              {c.paragraphs.map((p, i) => (
                <p
                  key={i}
                  /* перенос строки из контента учитывается с планшета — на телефоне текст
                     переносится сам, как в оригинале */
                  className="text-body text-[16px] leading-6 whitespace-normal md:whitespace-pre-line xl:text-[18px] xl:leading-7"
                >
                  {p}
                </p>
              ))}
            </div>

            <a
              href={c.resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent ease-figma mt-6 hidden self-start px-4 py-2 text-[16px] leading-6 font-semibold transition-colors duration-200 md:block xl:mt-8"
            >
              {c.resumeLabel}
            </a>
          </div>

          {/* Портрет и инструменты */}
          <div className="mt-6 flex flex-col items-center md:mt-0 md:min-w-0 md:flex-1">
            <div className="relative -mx-5 h-[372px] w-[calc(100%+2.5rem)] md:mx-0 md:h-[292px] md:w-[304px] xl:h-[365px] xl:w-[380px]">
              <Image
                src={portrait}
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 1280px) 380px, (min-width: 800px) 304px, 100vw"
                className="object-cover"
              />
            </div>

            <h6 className="text-muted -mt-0.5 text-[12px] leading-4 uppercase md:mt-6 xl:mt-8 xl:text-[14px] xl:leading-5">
              {c.toolsLabel}
            </h6>

            <ul className="mt-4 flex items-center gap-5">
              {tools.map((tool, i) => (
                <li key={i} className="relative h-[34px] w-[34px]">
                  <Image src={tool.icon} alt="" aria-hidden="true" width={34} height={34} className="h-[34px] w-[34px]" />
                  {tool.overlays?.map((o, j) => (
                    <Image
                      key={j}
                      src={o.src}
                      alt=""
                      aria-hidden="true"
                      width={o.w}
                      height={o.h}
                      className="absolute"
                      style={{ left: o.x, top: o.y, width: o.w, height: o.h }}
                    />
                  ))}
                </li>
              ))}
            </ul>

            {badges.map((b) => (
              <Image key={b} src={b} alt="" aria-hidden="true" width={196} height={34} className="mt-5 h-[34px] w-[196px]" />
            ))}

            <a
              href={c.resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted ease-figma mt-6 px-4 py-2 text-[16px] leading-6 font-semibold transition-colors duration-200 md:hidden"
            >
              {c.resumeLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
