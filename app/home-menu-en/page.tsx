import { pageMetadata } from "@/lib/metadata";
import Body from "@/components/generated/home-menu-en";

export const metadata = pageMetadata({ path: "/home-menu-en" });

export default function Page() {
  return <Body />;
}
