import { pageMetadata } from "@/lib/metadata";
import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/eazychange-en";

export const metadata = pageMetadata({ path: "/eazychange-en", title: "Eazychange" });

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
