import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/mikulich-en";

export const metadata = { title: "ivan.grigorenko.dsgn — Dr. Mikulich" };

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
