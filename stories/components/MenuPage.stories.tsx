import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MenuPage from "@/components/MenuPage";

const meta: Meta<typeof MenuPage> = {
  title: "Компоненты/Экран меню",
  component: MenuPage,
  args: { lang: "ru", active: "work", back: "/home-ru", altMenu: "/home-menu-en" },
  argTypes: {
    lang: { name: "Язык", control: "inline-radio", options: ["ru", "en"] },
    active: { name: "Активный пункт", control: "inline-radio", options: ["work", "about", undefined] },
    back: { name: "Куда ведёт крестик" },
    altMenu: { name: "Это же меню на другом языке" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "На экранах уже 1280px бургер открывает отдельную страницу меню. Активный пункт — не ссылка и без стрелки.",
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof MenuPage>;

export const СГлавной: Story = { name: "С главной" };
export const СОбоМне: Story = { name: "С «Обо мне»", args: { active: "about", back: "/about-ru", altMenu: "/about-menu-en" } };
export const ИзКейса: Story = { name: "Из кейса", args: { active: undefined, back: "/pot-ru", altMenu: "/pot-menu-en" } };
export const Английское: Story = { args: { lang: "en", back: "/", altMenu: "/home-menu-ru" } };
