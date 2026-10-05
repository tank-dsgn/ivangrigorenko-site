import type { Metadata } from "next";
import Header from "@/components/Header";
import Variant from "@/components/contacts/VariantB";

// временная страница для выбора варианта — в поиск не идёт
export const metadata: Metadata = { title: "Контакты — вариант B", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <>
      <Header lang="ru" active="contacts" />
      <main className="flex min-h-screen flex-col pt-14 xl:pt-20">
        <Variant lang="ru" />
      </main>
    </>
  );
}
