import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/ostral-en";

export const metadata = { title: "ivan.grigorenko.dsgn — Ostral" };

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
