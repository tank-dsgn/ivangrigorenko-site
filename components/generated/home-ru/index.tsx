// Порядок секций страницы home-ru. Сгенерировано.

import S1Block from "./S1Block";
import S2Block from "./S2Block";

export const shell = {"header":{"mobile":true,"tablet":true,"desktop":true},"footer":{"mobile":true,"tablet":true,"desktop":true}} as const;

export default function Page() {
  return (
    <>
      {/* 1 block */}
      <S1Block />
      {/* 2 block */}
      <S2Block />
    </>
  );
}
