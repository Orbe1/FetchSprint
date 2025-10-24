"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoginButton from "./ui/LoginLogoutButton";

export default function HomeHeader() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Search and Learning removed (similarity features) */}
      <Button
        variant="outline"
        onClick={() => {
          router.push("/profile_page");
        }}
      >
        Profile
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          router.push("/create_post");
        }}
      >
        Create Post
      </Button>
      <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white lg:static lg:size-auto lg:bg-none">
        <LoginButton />
      </div>
    </div>
  );
}
