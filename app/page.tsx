import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/home-en";

export const metadata = pageMetadata({ path: "/" });

// Корень сайта — английская главная, как в оригинале
export default function Page() {
  return (
    <SitePage lang="en" shell={shell} active="work">
      <Body />
    </SitePage>
  );
}
