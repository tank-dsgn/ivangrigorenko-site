import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MenuPage from "@/components/MenuPage";

const meta: Meta<typeof MenuPage> = {
  title: "Components/Menu screen",
  component: MenuPage,
  args: { lang: "en", active: "work", back: "/", altMenu: "/home-menu-ru" },
  argTypes: {
    lang: { name: "Language", description: "Site language version", control: "inline-radio", options: ["en", "ru"] },
    active: {
      name: "Active item",
      description: "Highlighted item; case study pages have none",
      control: "inline-radio",
      options: ["work", "about", undefined],
    },
    back: { name: "Close link", description: "Where the close icon leads — the page the visitor came from" },
    altMenu: { name: "Other language menu", description: "The same menu in the other language" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Below 1280px the burger opens a separate menu page. The active item is not a link and has no chevron.",
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof MenuPage>;

export const FromHome: Story = { name: "From home" };
export const FromAbout: Story = { name: "From About", args: { active: "about", back: "/about-en", altMenu: "/about-menu-ru" } };
export const FromCaseStudy: Story = { name: "From a case study", args: { active: undefined, back: "/pot-en", altMenu: "/pot-menu-ru" } };
export const Russian: Story = { args: { lang: "ru", back: "/home-ru", altMenu: "/home-menu-en" } };
