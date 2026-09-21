import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/ostral-ru";

export const metadata = { title: "ivan.grigorenko.dsgn — Ostral" };

export default function Page() {
  return (
    <CasePage lang="ru" shell={shell}>
      <Body />
    </CasePage>
  );
}
