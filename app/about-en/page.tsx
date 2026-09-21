import Header from "@/components/Header";
import About from "@/components/About";
import Footer from "@/components/Footer";

export const metadata = { title: "ivan.grigorenko.dsgn — About" };

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
