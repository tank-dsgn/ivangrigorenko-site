import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Header from "@/components/Header";

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  args: { lang: "en", active: "work" },
  argTypes: {
    lang: { name: "Language", description: "Site language version", control: "inline-radio", options: ["en", "ru"] },
    active: {
      name: "Active item",
      description: "Navigation item highlighted in indigo",
      control: "inline-radio",
      options: ["work", "about", undefined],
    },
  },
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
    docs: {
      description: {
        component:
          "Fixed to the top of the window. From 1280px it shows navigation and the language switch; below that, the logo and a burger that leads to the menu screen. Switch the width with the viewport button in the toolbar.",
      },
    },
  },
  // шапка position: fixed — держим её внутри своей рамки, чтобы не уезжала на страницу документации
  decorators: [(Story) => <div className="h-20 [transform:translateZ(0)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Header>;

export const Home: Story = {};
export const About: Story = {
  args: { active: "about" },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/about-en" } } },
};
export const CaseStudy: Story = {
  name: "Case study",
  args: { active: undefined },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/pot-en" } } },
};
export const Russian: Story = {
  args: { lang: "ru" },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/home-ru" } } },
};
export const Mobile: Story = { globals: { viewport: { value: "mobile" } } };
