import { redirect } from "next/navigation";

export default function NewUserQuestionnaire() {
  // Questionnaire removed — redirect users to their profile page instead
  redirect("/profile_page");
}
