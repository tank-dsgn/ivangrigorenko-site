import { pageMetadata } from "@/lib/metadata";
import Header from "@/components/Header";
import About from "@/components/About";
import Footer from "@/components/Footer";

export const metadata = pageMetadata({ path: "/about-ru", title: "Обо мне" });

export default function AboutRu() {
  return (
    <>
      <Header lang="ru" active="about" />
      <main className="pt-14 xl:pt-20">
        <About lang="ru" />
      </main>
      <Footer lang="ru" />
    </>
  );
}
