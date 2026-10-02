import { pageMetadata } from "@/lib/metadata";
import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/pot-ru";

export const metadata = pageMetadata({ path: "/pot-ru", title: "POT" });

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
