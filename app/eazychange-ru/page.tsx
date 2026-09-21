import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/eazychange-ru";

export const metadata = { title: "ivan.grigorenko.dsgn — Eazychange" };

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
