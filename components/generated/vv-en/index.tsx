// Порядок секций страницы vv-en. Сгенерировано.

import Hero from "./Hero";
import Overview from "./Overview";
import ProblemStatement from "./ProblemStatement";
import Audit from "./Audit";
import Research from "./Research";
import S1Block from "./S1Block";
import Tokens from "./Tokens";
import Chema from "./Chema";
import Figma from "./Figma";
import Komponents from "./Komponents";
import Icons from "./Icons";
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
      {/* Audit */}
      <Audit />
      {/* Research */}
      <Research />
      {/* 1 block */}
      <S1Block />
      {/* Tokens */}
      <Tokens />
      {/* Chema */}
      <Chema />
      {/* Figma  */}
      <Figma />
      {/* Komponents */}
      <Komponents />
      {/* Icons */}
      <Icons />
      {/* Problem Statement */}
      <ProblemStatement2 />
      {/* More projects */}
      <MoreProjects />
    </>
  );
}
