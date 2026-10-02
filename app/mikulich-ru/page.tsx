import { pageMetadata } from "@/lib/metadata";
import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/mikulich-ru";

export const metadata = pageMetadata({ path: "/mikulich-ru", title: "Dr. Mikulich" });

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
