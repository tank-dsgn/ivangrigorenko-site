import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ProjectCard from "@/components/ProjectCard";
// те же данные, с которыми карточки выводит сайт
import { projectCards, projects, type Lang, type Project, type ProjectCardProps as Card } from "../data";

const cards: Record<Lang, Card[]> = { ru: projectCards("ru"), en: projectCards("en") };

const find = (lang: Lang, project: Project, size: Card["size"]) =>
  cards[lang].find((c) => c.size === size && c.href.startsWith(`/${project}-`))!;

type Args = Pick<Card, "size" | "tags" | "title" | "description" | "href"> & { project: Project; lang: Lang };

// телефонная карточка тянется на ширину колонки — даём ей колонку 335px, как на экране 375px
function Frame({ size, children }: { size: Card["size"]; children: React.ReactNode }) {
  return size === "mobile" ? (
    <div className="flex w-[335px] flex-col gap-6">{children}</div>
  ) : (
    <div className="flex flex-col gap-10">{children}</div>
  );
}

const meta: Meta<Args> = {
  title: "Components/Project card",
  parameters: {
    backgrounds: { value: "page" },
    docs: {
      description: {
        component:
          "Project card on the home page. Three sizes, one per breakpoint. Texts can be edited in the controls; the image and its position are specific to each project and come from the mockup. Hover works on the desktop size: a 6px lift, a denser shadow and a slight image zoom.",
      },
    },
  },
  argTypes: {
    size: { name: "Size", description: "One per breakpoint", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    project: { name: "Project image", description: "Image and its position in the card window", control: "select", options: projects },
    lang: { table: { disable: true } },
    tags: { name: "Tags", description: "Line above the title: domain, type of work" },
    title: { name: "Title" },
    description: { name: "Description", control: "text" },
    href: { name: "Link" },
  },
  render: ({ project, lang, ...props }) => (
    <Frame size={props.size}>
      <ProjectCard {...props} image={find(lang, project, props.size).image} />
    </Frame>
  ),
};
export default meta;
type Story = StoryObj<Args>;

const story = (project: Project, lang: Lang = "en", size: Card["size"] = "desktop"): Story => {
  const { image: _image, ...text } = find(lang, project, size);
  return { args: { ...text, project, lang } };
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

/** Все шесть карточек подряд, как на главной */
export const AllProjects: StoryObj<{ size: Card["size"]; lang: Lang }> = {
  name: "All projects",
  args: { size: "desktop", lang: "en" },
  argTypes: {
    size: { name: "Size", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    lang: { name: "Language", control: "inline-radio", options: ["en", "ru"], table: { disable: false } },
  },
  parameters: { layout: "padded", controls: { include: ["Size", "Language"] } },
  render: ({ size, lang }) => (
    <div className="flex justify-center">
      <Frame size={size}>
        {cards[lang].filter((c) => c.size === size).map((c) => (
          <ProjectCard key={c.href} {...c} />
        ))}
      </Frame>
    </div>
  ),
};
