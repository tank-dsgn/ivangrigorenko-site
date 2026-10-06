// Данные, с которыми сайт выводит свои компоненты. Сами файлы пишет генератор
// (tools/figma/generate.mjs) при сборке страниц из макета — руками их не правят.
import type { ComponentProps } from "react";
import type Button from "@/components/Button";
import type ProjectCard from "@/components/ProjectCard";
import type RelatedCard from "@/components/RelatedCard";

import homeRu from "./home-ru.json";
import homeEn from "./index.json";
import eazychangeRu from "./eazychange-ru.json";
import eazychangeEn from "./eazychange-en.json";
import autotorRu from "./autotor-ru.json";
import autotorEn from "./autotor-en.json";
import potRu from "./pot-ru.json";
import potEn from "./pot-en.json";
import ostralRu from "./ostral-ru.json";
import ostralEn from "./ostral-en.json";
import vvRu from "./vv-ru.json";
import vvEn from "./vv-en.json";
import mikulichRu from "./mikulich-ru.json";
import mikulichEn from "./mikulich-en.json";
import aboutRu from "./about-ru.json";
import aboutEn from "./about-en.json";

export type Lang = "ru" | "en";
export type ProjectCardProps = ComponentProps<typeof ProjectCard>;
export type RelatedCardProps = ComponentProps<typeof RelatedCard>;
export type ButtonProps = ComponentProps<typeof Button>;

type Page = { ProjectCard?: unknown[]; RelatedCard?: unknown[]; Button?: unknown[] };
const pages: Record<Lang, Page[]> = {
  ru: [homeRu, eazychangeRu, autotorRu, potRu, ostralRu, vvRu, mikulichRu, aboutRu],
  en: [homeEn, eazychangeEn, autotorEn, potEn, ostralEn, vvEn, mikulichEn, aboutEn],
};

const collect = <T,>(lang: Lang, component: keyof Page) =>
  pages[lang].flatMap((p) => (p[component] ?? []) as T[]);

/** без повторов: одна и та же карточка стоит на нескольких страницах */
const unique = <T,>(items: T[], key: (item: T) => string) => [
  ...new Map(items.map((item) => [key(item), item])).values(),
];

export const projects = ["eazychange", "autotor", "pot", "ostral", "vv", "mikulich"] as const;
export type Project = (typeof projects)[number];
export const projectOf = (href: string) => href.replace(/^\/|-(ru|en)$/g, "") as Project;

export const projectCards = (lang: Lang) => collect<ProjectCardProps>(lang, "ProjectCard");
export const relatedCards = (lang: Lang) =>
  unique(collect<RelatedCardProps>(lang, "RelatedCard"), (c) => `${c.size} ${c.href}`);
export const buttons = (lang: Lang) =>
  unique(collect<ButtonProps>(lang, "Button"), (b) => `${b.label} ${b.width ?? ""} ${b.wideLabel ?? ""}`);
