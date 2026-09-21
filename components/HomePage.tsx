import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import { projects } from "@/lib/content/home";
import type { Lang } from "@/lib/site";

export default function HomePage({ lang }: { lang: Lang }) {
  return (
    <>
      <Header lang={lang} active="work" />

      {/* отступ под фиксированную шапку: 56px на узких экранах, 80px на десктопе */}
      <main className="pt-14 xl:pt-20">
        <Hero lang={lang} />

        <section
          id="projects"
          className="flex flex-col items-center gap-6 px-5 pt-8 pb-8 md:gap-10 md:px-10 md:pt-10 md:pb-10 xl:gap-[46px] xl:px-14 xl:pt-[62px] xl:pb-14"
        >
          {projects[lang].map((project, i) => (
            <div key={project.slug} className="w-full max-w-[350px] md:max-w-[720px] xl:max-w-[920px]">
              <ProjectCard project={project} lang={lang} priority={i === 0} />
            </div>
          ))}
        </section>
      </main>

      <Footer lang={lang} />
    </>
  );
}
