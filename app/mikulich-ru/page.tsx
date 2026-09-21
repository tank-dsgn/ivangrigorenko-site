import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/mikulich-ru";

export const metadata = { title: "ivan.grigorenko.dsgn — Dr. Mikulich" };

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
