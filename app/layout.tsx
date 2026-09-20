import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ivangrigorenko.com"),
  title: "ivan.grigorenko.dsgn",
  description:
    "Иван Григоренко — UX/UI дизайнер. Создаю понятные, эстетичные и продуманные цифровые продукты.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "ivan.grigorenko.dsgn",
    description:
      "Иван Григоренко — UX/UI дизайнер. Создаю понятные, эстетичные и продуманные цифровые продукты.",
    images: ["/og.png"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={openSans.variable}>
      <body className={`${openSans.className} antialiased`}>{children}</body>
    </html>
  );
}
