import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Header from "@/components/Header";

const meta: Meta<typeof Header> = {
  title: "Компоненты/Шапка",
  component: Header,
  args: { lang: "ru", active: "work" },
  argTypes: {
    lang: { name: "Язык", control: "inline-radio", options: ["ru", "en"] },
    active: { name: "Активный пункт", control: "inline-radio", options: ["work", "about", undefined] },
  },
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/home-ru" } },
    docs: {
      description: {
        component:
          "Шапка прибита к верху окна. От 1280px — навигация и переключатель языка, уже — логотип и бургер, который ведёт на экран меню. Ширину переключайте кнопкой размера окна в панели сверху.",
      },
    },
  },
  // шапка position: fixed — держим её внутри своей рамки, чтобы не уезжала на страницу документации
  decorators: [(Story) => <div className="h-20 [transform:translateZ(0)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Header>;

export const Главная: Story = {};
export const ОбоМне: Story = {
  name: "Обо мне",
  args: { active: "about" },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/about-ru" } } },
};
export const Кейс: Story = {
  args: { active: undefined },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/pot-ru" } } },
};
export const Английская: Story = {
  args: { lang: "en" },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/" } } },
};
export const Телефон: Story = { globals: { viewport: { value: "mobile" } } };
