import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/about-en";

export const metadata = pageMetadata({ path: "/about-en", title: "About" });

export default function Page() {
  return (
    <SitePage lang="en" shell={shell} active="about">
      <Body />
    </SitePage>
  );
}
