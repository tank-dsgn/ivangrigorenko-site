import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/vv-en";

export const metadata = { title: "ivan.grigorenko.dsgn — Design system" };

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
