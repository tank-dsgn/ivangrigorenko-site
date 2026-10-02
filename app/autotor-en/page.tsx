import { pageMetadata } from "@/lib/metadata";
import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/autotor-en";

export const metadata = pageMetadata({ path: "/autotor-en", title: "autotor.pl" });

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
