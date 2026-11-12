// The order of the sections on autotor-en. Generated.

import Hero from "./Hero";
import Overview from "./Overview";
import ProblemStatement from "./ProblemStatement";
import Research from "./Research";
import Flow from "./Flow";
import Design from "./Design";
import ProblemStatement2 from "./ProblemStatement2";
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
      {/* Flow */}
      <Flow />
      {/* Design */}
      <Design />
      {/* Problem Statement */}
      <ProblemStatement2 />
      {/* More projects */}
      <MoreProjects />
    </>
  );
}
