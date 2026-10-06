import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@/components/Button";
// кнопки, которые реально стоят на страницах
import { buttons, type Lang } from "../data";

const meta: Meta<typeof Button> = {
  title: "Компоненты/Кнопка",
  component: Button,
  args: { href: "https://example.com", label: "Скачать моё резюме", newTab: true, width: undefined, wideLabel: false },
  argTypes: {
    label: { name: "Подпись" },
    href: { name: "Ссылка" },
    newTab: { name: "В новой вкладке" },
    width: {
      name: "Ширина",
      description: "Пусто — по тексту; fill — на всю ширину блока; либо точное значение, например 335px",
      control: "select",
      options: [undefined, "fill", "335px"],
    },
    wideLabel: { name: "Подпись на всю кнопку, слева" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Контурная кнопка сайта, высота 40px. При наведении обводка и текст становятся индиго. Крупная кнопка первого экрана — отдельный компонент «Кнопка „Связаться со мной“».",
      },
    },
  },
  // блок, внутри которого видно, как кнопка тянется на всю ширину
  decorators: [(Story) => <div className="flex w-[335px] flex-col items-start"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Button>;

export const ПоТексту: Story = { name: "По тексту" };
export const НаВсюШирину: Story = { name: "На всю ширину", args: { width: "fill" } };
export const ПодписьСлева: Story = { name: "Подпись слева", args: { label: "Посетить сайт", width: "fill", wideLabel: true } };

/** Все кнопки, которые сейчас стоят на страницах сайта */
export const НаСайте: StoryObj<{ lang: Lang }> = {
  name: "Все кнопки сайта",
  args: { lang: "ru" },
  argTypes: { lang: { name: "Язык", control: "inline-radio", options: ["ru", "en"] } },
  parameters: { controls: { include: ["Язык"] } },
  render: ({ lang }) => (
    <div className="flex w-[335px] flex-col items-start gap-4">
      {buttons(lang).map((b, i) => (
        <Button key={i} {...b} />
      ))}
    </div>
  ),
};
