import { redirect } from "next/navigation";

// Корень пока ведёт на русскую главную — английская версия будет отдельной страницей
export default function Root() {
  redirect("/home-ru");
}
