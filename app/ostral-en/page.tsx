import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/ostral-en";

export const metadata = pageMetadata({ path: "/ostral-en", title: "Ostral" });

export default function Page() {
  return (
    <SitePage lang="en" shell={shell}>
      <Body />
    </SitePage>
  );
}
