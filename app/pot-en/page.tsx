import CasePage from "@/components/CasePage";
import Body, { shell } from "@/components/generated/pot-en";

export const metadata = { title: "ivan.grigorenko.dsgn — POT" };

export default function Page() {
  return (
    <CasePage lang="en" shell={shell}>
      <Body />
    </CasePage>
  );
}
