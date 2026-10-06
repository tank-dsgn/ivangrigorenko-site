import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Footer from "@/components/Footer";

const meta: Meta<typeof Footer> = {
  title: "Компоненты/Блок контактов",
  component: Footer,
  args: { lang: "ru" },
  argTypes: { lang: { name: "Язык", control: "inline-radio", options: ["ru", "en"] } },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Низ каждой страницы. Заголовок основным цветом, под ним иконки: Behance, LinkedIn, Dribbble, Telegram, почта. Все открываются в новой вкладке. Ссылки и адрес почты — в lib/site.ts.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Footer>;

export const Русский: Story = {};
export const Английский: Story = { args: { lang: "en" } };
export const Телефон: Story = { globals: { viewport: { value: "mobile" } } };
