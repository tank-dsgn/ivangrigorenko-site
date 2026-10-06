import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Footer from "@/components/Footer";

const meta: Meta<typeof Footer> = {
  title: "Components/Contact block",
  component: Footer,
  args: { lang: "en" },
  argTypes: {
    lang: { name: "Language", description: "Site language version", control: "inline-radio", options: ["en", "ru"] },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bottom of every page. Title in the primary color, then icons: Behance, LinkedIn, Dribbble, Telegram, email. All open in a new tab. Links and the email address live in lib/site.ts.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Footer>;

export const English: Story = {};
export const Russian: Story = { args: { lang: "ru" } };
export const Mobile: Story = { globals: { viewport: { value: "mobile" } } };
