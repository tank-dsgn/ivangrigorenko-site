import { pageMetadata } from "@/lib/metadata";
import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/eazychange-ru";

export const metadata = pageMetadata({ path: "/eazychange-ru", title: "Eazychange" });

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
