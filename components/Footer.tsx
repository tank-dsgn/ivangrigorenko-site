import { mailtoHref, socials, t, type Lang } from "@/lib/site";

export default function Footer({ lang }: { lang: Lang }) {
  const s = t[lang];

  return (
    <footer
      id="contacts"
      // якорь не должен уезжать под фиксированную шапку
      className="scroll-mt-14 xl:scroll-mt-20 flex flex-col items-center px-5 pt-8 pb-8 text-center md:pt-10 md:pb-10 xl:pt-18 xl:pb-18"
    >
      <h2 className="text-ink text-[20px] leading-7 font-semibold md:text-[24px] md:leading-8 xl:text-[30px] xl:leading-9">
        {s.footer.title}
      </h2>

      <p className="text-body-strong mt-2 text-[15px] leading-5 md:text-[18px] md:leading-7 xl:mt-3 xl:text-[20px]">
        {s.footer.subtitle}
      </p>

      <ul className="mt-5 flex items-center gap-8 xl:mt-8 xl:gap-10">
        {[
          ...socials.map((x) => ({ ...x, external: true })),
          // письмо: адрес текстом над иконками убран 2026-10-05, осталась иконка
          { name: "Email", href: mailtoHref(lang), icon: "/icons/mail.svg", w: 32, h: 32, external: false },
        ].map((x) => (
          <li key={x.name}>
            <a
              href={x.href}
              {...(x.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={x.name}
              // иконка — маска, цвет задаёт текст: серый, при наведении основной индиго
              className="text-faint hover:text-accent focus-visible:text-accent ease-figma flex h-6 w-6 items-center justify-center transition-colors duration-200 md:h-7 md:w-7 xl:h-8 xl:w-8"
            >
              <span
                aria-hidden="true"
                className="block w-full bg-current"
                style={{
                  aspectRatio: `${x.w} / ${x.h}`,
                  maskImage: `url(${x.icon})`,
                  WebkitMaskImage: `url(${x.icon})`,
                  maskSize: "100% 100%",
                  WebkitMaskSize: "100% 100%",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                }}
              />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
