import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/autotor-ru";

export const metadata = { title: "ivan.grigorenko.dsgn — autotor.pl" };

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
