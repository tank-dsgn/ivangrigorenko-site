import Image from "next/image";
import Link from "next/link";
import { caseHref, type Project } from "@/lib/content/home";
import type { Lang } from "@/lib/site";

export default function ProjectCard({
  project,
  lang,
  priority = false,
}: {
  project: Project;
  lang: Lang;
  priority?: boolean;
}) {
  const { slug, tag, tagNarrow, title, description, image, backdrop, zoom, mobileImageHeight } =
    project;

  return (
    <Link
      href={caseHref(slug, lang)}
      className="group shadow-card focus-visible:outline-accent block overflow-hidden rounded-xl bg-white focus-visible:outline-2 focus-visible:outline-offset-2 xl:rounded-3xl"
    >
      <div className="flex flex-col md:h-80 md:flex-row xl:h-100">
        <div
          className="relative h-[var(--img-h)] shrink-0 overflow-hidden md:h-full md:w-96 xl:w-[548px]"
          style={
            {
              background: backdrop,
              "--img-h": `${mobileImageHeight ?? 240}px`,
              "--zoom": zoom ?? 1,
            } as React.CSSProperties
          }
        >
          <Image
            src={image}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 548px, (min-width: 800px) 384px, 100vw"
            className="ease-figma scale-[var(--zoom)] object-cover transition-transform duration-300 group-hover:scale-[calc(var(--zoom)*1.07)]"
          />
        </div>

        <div className="flex flex-1 flex-col px-5 pt-4 pb-10 md:p-6">
          <p className="text-muted text-[12px] leading-4 uppercase xl:text-[14px] xl:leading-5">
            {tagNarrow ? (
              <>
                <span className="xl:hidden">{tagNarrow}</span>
                <span className="hidden xl:inline">{tag}</span>
              </>
            ) : (
              tag
            )}
          </p>

          <h2 className="text-ink mt-2 text-[20px] leading-7 font-semibold md:text-[24px] md:leading-8 xl:mt-3 xl:text-[30px] xl:leading-9">
            {title}
          </h2>

          <p className="text-body mt-2 text-[16px] leading-6 md:mt-3 xl:mt-4 xl:text-[18px] xl:leading-7">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
