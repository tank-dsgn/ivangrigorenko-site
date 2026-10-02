import { pageMetadata } from "@/lib/metadata";
import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/pot-en";

export const metadata = pageMetadata({ path: "/pot-en", title: "POT" });

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
