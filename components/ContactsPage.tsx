import Header from "@/components/Header";
import { EMAIL, RESUME_URL, TELEGRAM, mailtoHref, socials, t, type Lang } from "@/lib/site";

/**
 * Страница контактов. В оригинале её нет — добавлена 2026-10-05.
 * Оформление взято со страницы «Обо мне»: тот же фон, заголовок, текст и кнопка.
 * Футера здесь нет: на остальных страницах он и есть блок контактов.
 */
export default function ContactsPage({ lang }: { lang: Lang }) {
  const s = t[lang];
  const link = (name: string) => socials.find((x) => x.name === name)!.href;

  const rows = [
    { label: s.contacts.email, value: EMAIL, href: mailtoHref(lang), external: false },
    { label: "Telegram", value: TELEGRAM.handle, href: TELEGRAM.href, external: true },
    { label: "LinkedIn", value: "Ivan Grigorenko", href: link("LinkedIn"), external: true },
    { label: "Behance", value: "ivangrigorenko", href: link("Behance"), external: true },
    { label: "Dribbble", value: "ivangrigorenko", href: link("Dribbble"), external: true },
  ];

  return (
    <>
      <Header lang={lang} active="contacts" />

      {/* отступ под фиксированную шапку; фон тянется до низа окна */}
      <main className="flex min-h-screen flex-col pt-14 xl:pt-20">
        <section className="flex-1 bg-[#fafaf9] px-5 py-8 md:px-10 md:py-10 xl:px-14 xl:py-20">
          <div className="mx-auto flex max-w-[960px] flex-col gap-8 xl:flex-row xl:gap-16">
            <div className="xl:w-[400px] xl:shrink-0">
              <h1 className="text-ink text-[24px] leading-8 font-bold xl:text-[30px] xl:leading-9">
                {s.footer.title}
              </h1>
              <p className="text-body mt-4 text-[16px] leading-6 md:text-[18px] md:leading-7 xl:mt-6">
                {s.footer.subtitle}
              </p>
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent ease-figma mt-8 inline-flex h-10 items-center rounded-full bg-white px-4 text-[16px] leading-6 font-semibold shadow-[inset_0_0_0_1px_#94a3b8] transition-colors duration-200 hover:shadow-[inset_0_0_0_1px_#4f46e5]"
              >
                {s.contacts.resume}
              </a>
            </div>

            <ul className="flex-1 border-t border-slate-200">
              {rows.map((row) => (
                <li key={row.label} className="border-b border-slate-200">
                  <a
                    href={row.href}
                    {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex flex-col gap-1 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:py-5"
                  >
                    <span className="text-muted text-[14px] leading-5 uppercase">{row.label}</span>
                    <span className="text-ink group-hover:text-accent ease-figma text-[18px] leading-7 font-semibold break-all transition-colors duration-200 md:text-[20px]">
                      {row.value}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
