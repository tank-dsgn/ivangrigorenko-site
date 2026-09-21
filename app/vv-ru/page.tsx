import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/vv-ru";

export const metadata = { title: "ivan.grigorenko.dsgn — Дизайн-система" };

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
