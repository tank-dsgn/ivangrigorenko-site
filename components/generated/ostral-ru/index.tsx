// Порядок секций страницы ostral-ru. Сгенерировано.

import Hero from "./Hero";
import Overview from "./Overview";
import ProblemStatement from "./ProblemStatement";
import Users from "./Users";
import Flow from "./Flow";
import Design from "./Design";
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
      {/* Users */}
      <Users />
      {/* Flow */}
      <Flow />
      {/* Design */}
      <Design />
      {/* conclusion */}
      <Conclusion />
      {/* More projects */}
      <MoreProjects />
    </>
  );
}
