import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = { title: "ivangrigorenko — 404" };

export default function NotFound() {
  return (
    <>
      <Header lang="ru" />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 pt-14 xl:pt-20">
        <p className="text-muted text-[16px] leading-6">404</p>
        <h1 className="text-ink mt-4 text-center text-[24px] leading-8 font-bold xl:text-[36px] xl:leading-10">
          Такой страницы нет
        </h1>
        <Link
          href="/home-ru"
          className="text-accent ease-figma mt-8 text-[16px] leading-6 font-semibold transition-opacity duration-200 hover:opacity-70"
        >
          На главную
        </Link>
      </main>
      <Footer lang="ru" />
    </>
  );
}
