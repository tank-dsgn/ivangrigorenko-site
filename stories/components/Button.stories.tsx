import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@/components/Button";
// кнопки, которые реально стоят на страницах
import { buttons, type Lang } from "../data";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: { href: "https://example.com", label: "Download my resume", newTab: true, width: undefined, wideLabel: false },
  argTypes: {
    label: { name: "Label" },
    href: { name: "Link" },
    newTab: { name: "New tab", description: "Open in a new tab — for external links" },
    width: {
      name: "Width",
      description: "Empty — fits the label; fill — full width of the container; or an exact value such as 335px",
      control: "select",
      options: [undefined, "fill", "335px"],
    },
    wideLabel: {
      name: "Wide label",
      description: "The label takes the whole button and sits on the left — as “Visit website” does on narrow screens in the mockup",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Outlined site button, 40px high. On hover the outline and label turn indigo. The large hero button is a separate component, “Contact button”.",
      },
    },
  },
  // блок, внутри которого видно, как кнопка тянется на всю ширину
  decorators: [(Story) => <div className="flex w-[335px] flex-col items-start"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Button>;

export const FitLabel: Story = { name: "Fit label" };
export const FullWidth: Story = { name: "Full width", args: { width: "fill" } };
export const WideLabel: Story = { name: "Wide label", args: { label: "Visit website", width: "fill", wideLabel: true } };

/** Все кнопки, которые сейчас стоят на страницах сайта */
export const OnSite: StoryObj<{ lang: Lang }> = {
  name: "All site buttons",
  args: { lang: "en" },
  argTypes: { lang: { name: "Language", control: "inline-radio", options: ["en", "ru"] } },
  parameters: { controls: { include: ["Language"] } },
  render: ({ lang }) => (
    <div className="flex w-[335px] flex-col items-start gap-4">
      {buttons(lang).map((b, i) => (
        <Button key={i} {...b} />
      ))}
    </div>
  ),
};
