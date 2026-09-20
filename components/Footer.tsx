import Image from "next/image";
import { contactEmail, mailtoHref, socials } from "@/lib/projects";

export default function Footer() {
  return (
    <footer
      id="contacts"
      className="flex flex-col items-center px-5 pt-8 pb-8 text-center md:pt-10 md:pb-10 xl:pt-18 xl:pb-18"
    >
      <h2 className="text-ink text-[20px] leading-7 font-semibold md:text-[24px] md:leading-8 xl:text-[30px] xl:leading-9">
        Свяжитесь со мной
      </h2>

      <p className="text-body-strong mt-2 text-[15px] leading-5 md:text-[18px] md:leading-7 xl:mt-3 xl:text-[20px]">
        Открыт к новым проектам и сотрудничеству
      </p>

      <a
        href={mailtoHref}
        className="text-accent ease-figma mt-3 text-[16px] leading-6 transition-opacity duration-200 hover:opacity-70 xl:mt-4 xl:text-[20px] xl:leading-7"
      >
        {contactEmail}
      </a>

      <ul className="mt-5 flex items-center gap-8 xl:mt-8 xl:gap-10">
        {socials.map((s) => (
          <li key={s.name}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              className="ease-figma block transition-opacity duration-200 hover:opacity-70"
            >
              <Image
                src={s.icon}
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
                className="h-6 w-6 md:h-7 md:w-7 xl:h-8 xl:w-8"
              />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
