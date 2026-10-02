import { pageMetadata } from "@/lib/metadata";
import Body from "@/components/generated/home-menu-ru";

export const metadata = pageMetadata({ path: "/home-menu-ru" });

export default function Page() {
  return <Body />;
}
