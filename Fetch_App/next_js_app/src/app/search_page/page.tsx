import { redirect } from "next/navigation";

export default function SearchPage() {
  // Similarity-based search removed — redirect to feed
  redirect("/feed");
}

