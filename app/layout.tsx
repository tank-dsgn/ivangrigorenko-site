import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./figma-fonts.css";
import Analytics from "@/components/Analytics";
import { DEPLOY_URL } from "@/lib/pages";

// The same Open Sans files the original on Figma Sites serves. The Google Fonts
// build has slightly different letter widths — headings came out 2% narrower,
// which risks a different line break.
const openSans = localFont({
  src: [
    { path: "./fonts/OpenSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/OpenSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/OpenSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-open-sans",
});

// The light italic appears only in the Eazychange pull quotes, so it is not preloaded
const openSansItalic = localFont({
  src: [{ path: "./fonts/OpenSans-LightItalic.woff2", weight: "300", style: "italic" }],
  display: "swap",
  preload: false,
  variable: "--font-open-sans-italic",
});

export const metadata: Metadata = {
  metadataBase: new URL(DEPLOY_URL),
  title: "IvanGrigorenko",
  description:
    "Иван Григоренко — UX/UI дизайнер. Создаю понятные, эстетичные и продуманные цифровые продукты.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "IvanGrigorenko",
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
