import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/pot-ru";

export const metadata = { title: "ivan.grigorenko.dsgn — POT" };

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
