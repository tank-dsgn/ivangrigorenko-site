import { pageMetadata } from "@/lib/metadata";
import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/mikulich-en";

export const metadata = pageMetadata({ path: "/mikulich-en", title: "Dr. Mikulich" });

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
