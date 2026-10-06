import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RelatedCard from "@/components/RelatedCard";
// те же данные, с которыми карточки выводит сайт
import { projectOf, projects, relatedCards, type Lang, type Project, type RelatedCardProps as Card } from "../data";

const cards: Record<Lang, Card[]> = { ru: relatedCards("ru"), en: relatedCards("en") };
const find = (lang: Lang, project: Project, size: Card["size"]) =>
  cards[lang].find((c) => c.size === size && projectOf(c.href) === project)!;

type Args = Pick<Card, "size" | "label" | "href"> & { project: Project; lang: Lang };

const meta: Meta<Args> = {
  title: "Components/Related card",
  parameters: {
    backgrounds: { value: "page" },
    docs: {
      description: {
        component:
          "Small project card in the “See also” block at the end of each case study. Hover works on the desktop size: the window and label lift by 6px, the shadow gets denser, the image zooms slightly, the label turns indigo and semibold.",
      },
    },
  },
  argTypes: {
    size: { name: "Size", description: "One per breakpoint", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    project: { name: "Project image", description: "Image and its position in the card window", control: "select", options: projects },
    lang: { table: { disable: true } },
    label: { name: "Label", description: "Caption under the image" },
    href: { name: "Link" },
  },
  render: ({ project, lang, ...props }) => {
    const { image, frame } = find(lang, project, props.size);
    return <RelatedCard {...props} image={image} frame={frame} />;
  },
};
export default meta;
type Story = StoryObj<Args>;

const story = (project: Project, lang: Lang = "en", size: Card["size"] = "desktop"): Story => {
  const { label, href } = find(lang, project, size);
  return { args: { size, label, href, project, lang } };
};

export const Eazychange: Story = story("eazychange");
export const Autotor: Story = story("autotor");
export const Pot: Story = story("pot");
export const Ostral: Story = story("ostral");
export const VV: Story = story("vv");
export const Mikulich: Story = story("mikulich");
export const Tablet: Story = story("eazychange", "en", "tablet");
export const Mobile: Story = story("eazychange", "en", "mobile");
export const Russian: Story = story("eazychange", "ru");

/** Все шесть карточек сеткой, как в блоке «Смотрите также» */
export const AllCards: StoryObj<{ size: Card["size"]; lang: Lang }> = {
  name: "All cards",
  args: { size: "desktop", lang: "en" },
  argTypes: {
    size: { name: "Size", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    lang: { name: "Language", control: "inline-radio", options: ["en", "ru"], table: { disable: false } },
  },
  parameters: { layout: "padded", controls: { include: ["Size", "Language"] } },
  render: ({ size, lang }) => (
    <div className="mx-auto flex w-full max-w-[960px] flex-row flex-wrap items-start justify-center gap-6">
      {projects.map((project) => {
        const card = find(lang, project, size);
        return card ? <RelatedCard key={project} {...card} /> : null;
      })}
    </div>
  ),
};
