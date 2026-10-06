import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RelatedCard from "@/components/RelatedCard";
// те же данные, с которыми карточки выводит сайт
import { projectOf, projects, relatedCards, type Lang, type Project, type RelatedCardProps as Card } from "../data";

const cards: Record<Lang, Card[]> = { ru: relatedCards("ru"), en: relatedCards("en") };
const find = (lang: Lang, project: Project, size: Card["size"]) =>
  cards[lang].find((c) => c.size === size && projectOf(c.href) === project)!;

type Args = Pick<Card, "size" | "label" | "href"> & { project: Project; lang: Lang };

const meta: Meta<Args> = {
  title: "Компоненты/Карточка «Смотрите также»",
  parameters: {
    backgrounds: { value: "page" },
    docs: {
      description: {
        component:
          "Маленькая карточка проекта в конце каждого кейса. Наведение работает у десктопной: окно и подпись поднимаются на 6px, тень плотнее, картинка слегка растёт, подпись становится индиго и жирной.",
      },
    },
  },
  argTypes: {
    size: { name: "Размер", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    project: { name: "Картинка проекта", control: "select", options: projects },
    lang: { table: { disable: true } },
    label: { name: "Подпись" },
    href: { name: "Ссылка" },
  },
  render: ({ project, lang, ...props }) => {
    const { image, frame } = find(lang, project, props.size);
    return <RelatedCard {...props} image={image} frame={frame} />;
  },
};
export default meta;
type Story = StoryObj<Args>;

const story = (project: Project, lang: Lang = "ru", size: Card["size"] = "desktop"): Story => {
  const { label, href } = find(lang, project, size);
  return { args: { size, label, href, project, lang } };
};

export const Eazychange: Story = story("eazychange");
export const Autotor: Story = story("autotor");
export const Pot: Story = story("pot");
export const Ostral: Story = story("ostral");
export const VV: Story = story("vv");
export const Mikulich: Story = story("mikulich");
export const Планшет: Story = story("eazychange", "ru", "tablet");
export const Телефон: Story = story("eazychange", "ru", "mobile");

/** Все шесть карточек сеткой, как в блоке «Смотрите также» */
export const ВсеКарточки: StoryObj<{ size: Card["size"]; lang: Lang }> = {
  name: "Все карточки",
  args: { size: "desktop", lang: "ru" },
  argTypes: {
    size: { name: "Размер", control: "inline-radio", options: ["desktop", "tablet", "mobile"] },
    lang: { name: "Язык", control: "inline-radio", options: ["ru", "en"], table: { disable: false } },
  },
  parameters: { layout: "padded", controls: { include: ["Размер", "Язык"] } },
  render: ({ size, lang }) => (
    <div className="mx-auto flex w-full max-w-[960px] flex-row flex-wrap items-start justify-center gap-6">
      {projects.map((project) => {
        const card = find(lang, project, size);
        return card ? <RelatedCard key={project} {...card} /> : null;
      })}
    </div>
  ),
};
