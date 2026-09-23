// Порядок секций страницы pot-ru. Сгенерировано.

import Hero from "./Hero";
import Overview from "./Overview";
import ProblemStatement from "./ProblemStatement";
import Research from "./Research";
import UserResearch from "./UserResearch";
import Flow from "./Flow";
import Design from "./Design";
import Section10 from "./Section10";
import Section9 from "./Section9";
import Conclusion from "./Conclusion";
import MoreProjects from "./MoreProjects";

export const shell = {"header":{"mobile":true,"tablet":true,"desktop":true},"footer":{"mobile":true,"tablet":true,"desktop":true}} as const;

export default function Page() {
  return (
    <>
      {/* Hero */}
      <Hero />
      {/* Overview */}
      <Overview />
      {/* Problem Statement */}
      <ProblemStatement />
      {/* Research */}
      <Research />
      {/* User research */}
      <UserResearch />
      {/* Flow */}
      <Flow />
      {/* Design */}
      <Design />
      {/* Section 10 */}
      <Section10 />
      {/* Section 9 */}
      <Section9 />
      {/* Conclusion */}
      <Conclusion />
      {/* More projects */}
      <MoreProjects />
    </>
  );
}
