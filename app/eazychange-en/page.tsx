import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/eazychange-en";

export const metadata = { title: "ivan.grigorenko.dsgn — Eazychange" };

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
