import { mailtoHref, socials, t, type Lang } from "@/lib/site";

export default function Footer({ lang }: { lang: Lang }) {
  const s = t[lang];

  return (
    <footer
      id="contacts"
      // the anchor must not slide under the fixed header
      className="scroll-mt-14 xl:scroll-mt-20 flex flex-col items-center px-5 py-12 text-center md:py-16 xl:py-24"
    >
      <h2 className="text-accent text-[20px] leading-7 font-semibold md:text-[24px] md:leading-8 xl:text-[30px] xl:leading-9">
        {s.footer.title}
      </h2>

      <p className="text-body-strong mt-2 text-[15px] leading-5 md:text-[18px] md:leading-7 xl:mt-3 xl:text-[20px]">
        {s.footer.subtitle}
      </p>

      <ul className="mt-5 flex items-center gap-6 xl:mt-8 xl:gap-8">
        {[
          ...socials,
          // Email: the address shown as text above the icons was dropped on
          // 2026-10-05, leaving the icon. It opens in a new tab, like the
          // social links: if the visitor's mail lives in the browser, as Gmail
          // does, the message must not replace the site.
          { name: "Email", href: mailtoHref(lang), icon: "/icons/mail.svg", w: 32, h: 32 },
        ].map((x) => (
          <li key={x.name}>
            <a
              href={x.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={x.name}
              // the icon is a mask and takes its colour from the text: grey, indigo on hover
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
