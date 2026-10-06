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
  title: "Компоненты/Карточка проекта",
  parameters: {
    backgrounds: { value: "page" },
    docs: {
      description: {
        component:
          "Карточка проекта на главной. Три размера — по одному на брейкпоинт. Тексты справа внизу можно менять; картинка и её положение у каждого проекта свои и приходят из макета. Наведение работает у десктопной: подъём на 6px, плотнее тень, картинка слегка растёт.",
      },
    },
  },
  argTypes: {
    size: { name: "Размер", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    project: { name: "Картинка проекта", control: "select", options: projects },
    lang: { table: { disable: true } },
    tags: { name: "Теги" },
    title: { name: "Название" },
    description: { name: "Описание", control: "text" },
    href: { name: "Ссылка" },
  },
  render: ({ project, lang, ...props }) => (
    <Frame size={props.size}>
      <ProjectCard {...props} image={find(lang, project, props.size).image} />
    </Frame>
  ),
};
export default meta;
type Story = StoryObj<Args>;

const story = (project: Project, lang: Lang = "ru", size: Card["size"] = "desktop"): Story => {
  const { image: _image, ...text } = find(lang, project, size);
  return { args: { ...text, project, lang } };
};

export const Eazychange: Story = story("eazychange");
export const Autotor: Story = story("autotor");
export const Pot: Story = story("pot");
export const Ostral: Story = story("ostral");
export const VV: Story = story("vv");
export const Mikulich: Story = story("mikulich");
export const Планшет: Story = story("eazychange", "ru", "tablet");
export const Телефон: Story = story("eazychange", "ru", "mobile");
export const Английская: Story = story("eazychange", "en");

/** Все шесть карточек подряд, как на главной */
export const ВсеПроекты: StoryObj<{ size: Card["size"]; lang: Lang }> = {
  name: "Все проекты",
  args: { size: "desktop", lang: "ru" },
  argTypes: {
    size: { name: "Размер", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    lang: { name: "Язык", control: "inline-radio", options: ["ru", "en"], table: { disable: false } },
  },
  parameters: { layout: "padded", controls: { include: ["Размер", "Язык"] } },
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
