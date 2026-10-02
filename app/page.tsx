import { pageMetadata } from "@/lib/metadata";
import HomePage from "@/components/HomePage";

export const metadata = pageMetadata({ path: "/" });

// Корень сайта — английская главная, как в оригинале
export default function HomeEn() {
  return <HomePage lang="en" />;
}
