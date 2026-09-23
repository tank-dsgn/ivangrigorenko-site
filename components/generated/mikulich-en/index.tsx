// Порядок секций страницы mikulich-en. Сгенерировано.

import Hero from "./Hero";
import Overview from "./Overview";
import Research from "./Research";
import Metafor from "./Metafor";
import Sketching from "./Sketching";
import FinalDesign from "./FinalDesign";
import Style from "./Style";
import InContext from "./InContext";
import Conclusion from "./Conclusion";
import MoreProjects from "./MoreProjects";
import MoreProjects2 from "./MoreProjects2";

export const shell = {"header":{"mobile":true,"tablet":true,"desktop":true},"footer":{"mobile":true,"tablet":true,"desktop":true}} as const;

export default function Page() {
  return (
    <>
      {/* Hero */}
      <Hero />
      {/* Overview */}
      <Overview />
      {/* Research */}
      <Research />
      {/* Metafor */}
      <Metafor />
      {/* Sketching */}
      <Sketching />
      {/* Final Design */}
      <FinalDesign />
      {/* Style */}
      <Style />
      {/* In context */}
      <InContext />
      {/* Conclusion */}
      <Conclusion />
      {/* More projects */}
      <MoreProjects />
      {/* More projects */}
      <MoreProjects2 />
    </>
  );
}
