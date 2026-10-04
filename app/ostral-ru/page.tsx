import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/ostral-ru";

export const metadata = pageMetadata({ path: "/ostral-ru", title: "Ostral" });

export default function Page() {
  return (
    <SitePage lang="ru" shell={shell}>
      <Body />
    </SitePage>
  );
}
