import { pageMetadata } from "@/lib/metadata";
import HomePage from "@/components/HomePage";

export const metadata = pageMetadata({ path: "/home-ru" });

export default function HomeRu() {
  return <HomePage lang="ru" />;
}
