import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./figma-fonts.css";
import Analytics from "@/components/Analytics";
import { DEPLOY_URL } from "@/lib/pages";

// Те же файлы Open Sans, что отдаёт оригинал на Figma Sites. У версии из Google Fonts
// чуть другая ширина букв — заголовки выходили на 2% уже, а это риск другого переноса строк.
const openSans = localFont({
  src: [
    { path: "./fonts/OpenSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/OpenSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/OpenSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-open-sans",
});

// Светлый курсив встречается только в цитатах кейса Eazychange — заранее не грузим
const openSansItalic = localFont({
  src: [{ path: "./fonts/OpenSans-LightItalic.woff2", weight: "300", style: "italic" }],
  display: "swap",
  preload: false,
  variable: "--font-open-sans-italic",
});

export const metadata: Metadata = {
  metadataBase: new URL(DEPLOY_URL),
  title: "ivan.grigorenko.dsgn",
  description:
    "Иван Григоренко — UX/UI дизайнер. Создаю понятные, эстетичные и продуманные цифровые продукты.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "ivan.grigorenko.dsgn",
    description:
      "Иван Григоренко — UX/UI дизайнер. Создаю понятные, эстетичные и продуманные цифровые продукты.",
    images: [{ url: `${DEPLOY_URL}/og.png`, width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${openSans.variable} ${openSansItalic.variable}`}>
      <body className={`${openSans.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
