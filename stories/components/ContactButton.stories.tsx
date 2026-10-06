import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ContactButton from "@/components/ContactButton";

const meta: Meta<typeof ContactButton> = {
  title: "Компоненты/Кнопка «Связаться со мной»",
  component: ContactButton,
  args: { lang: "ru", mail: false, compact: false, full: false },
  argTypes: {
    lang: { name: "Язык", control: "inline-radio", options: ["ru", "en"] },
    mail: { name: "Открывает письмо", description: "Иначе прокручивает к блоку контактов" },
    compact: { name: "Обычный размер", description: "40px, текст 16px — как у остальных кнопок сайта" },
    full: { name: "На всю ширину" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Стоит в первом экране главной под заголовком. Наведите курсор: обводка и текст становятся индиго, вокруг мягкое свечение, по обводке бежит светлый участок.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ContactButton>;

export const НаГлавной: Story = { name: "На главной" };
export const Английская: Story = { args: { lang: "en" } };
export const ОбычныйРазмер: Story = { name: "Обычный размер", args: { compact: true } };
export const НаВсюШирину: Story = {
  name: "На всю ширину",
  args: { full: true },
  decorators: [(Story) => <div className="w-[335px]"><Story /></div>],
};
