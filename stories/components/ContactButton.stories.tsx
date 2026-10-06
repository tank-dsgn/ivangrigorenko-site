import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ContactButton from "@/components/ContactButton";

const meta: Meta<typeof ContactButton> = {
  title: "Components/Contact button",
  component: ContactButton,
  args: { lang: "en", mail: false, compact: false, full: false },
  argTypes: {
    lang: { name: "Language", description: "Label language", control: "inline-radio", options: ["en", "ru"] },
    mail: { name: "Opens an email", description: "Otherwise scrolls to the contact block" },
    compact: { name: "Regular size", description: "40px high, 16px text — same as the other site buttons" },
    full: { name: "Full width", description: "Stretches to the width of its container" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Sits in the home hero under the heading. On hover it fills with indigo from the point where the cursor entered and the label turns white; when the cursor leaves, the fill drains toward the exit point. Nothing happens on touch screens.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ContactButton>;

export const OnHome: Story = { name: "On home" };
export const Russian: Story = { args: { lang: "ru" } };
export const RegularSize: Story = { name: "Regular size", args: { compact: true } };
export const FullWidth: Story = {
  name: "Full width",
  args: { full: true },
  decorators: [(Story) => <div className="w-[335px]"><Story /></div>],
};
