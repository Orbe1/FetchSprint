import { redirect } from "next/navigation";

export default function LearnPage() {
  // Similarity-based learning page removed — redirect to feed
  redirect("/feed");
}

