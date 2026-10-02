import { pageMetadata } from "@/lib/metadata";
import Header from "@/components/Header";
import About from "@/components/About";
import Footer from "@/components/Footer";

export const metadata = pageMetadata({ path: "/about-en", title: "About" });

export default function AboutEn() {
  return (
    <>
      <Header lang="en" active="about" />
      <main className="pt-14 xl:pt-20">
        <About lang="en" />
      </main>
      <Footer lang="en" />
    </>
  );
}
