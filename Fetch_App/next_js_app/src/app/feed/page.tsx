"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/app/utils/supabase/client";
import HomeHeader from "@/components/homeHeader";
import SocialWall from "../social_wall/page";
import TopMatchesSidebar from "@/components/TopMatchesSidebar";
import UserGreetText from "@/components/ui/userGreetText";

export default function FeedPage() {
  console.log("SB URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "SB KEY present?",
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const router = useRouter();

  const checkAuthAndOnboarding = async () => {
    const {
      data: { session },
    } = await supabase().auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase().auth.getUser();

    if (user && !authError) {
      const { data: userData } = await supabase()
        .from("users")
        .select("completed_onboarding")
        .eq("id", user.id)
        .single();

      const hasCompletedOnboarding = userData?.completed_onboarding === true;

      if (!hasCompletedOnboarding) {
        router.push("/new_user");
        return;
      }
    }
  };

  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <UserGreetText />
        <HomeHeader />
      </div>

      <div className="flex gap-6 relative">
        <div className="flex-1">
          <SocialWall />
        </div>

        <div className="fixed top-50 right-6 w-[300px]">
          <TopMatchesSidebar />
        </div>
      </div>

      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]"></div>
    </main>
  );
}
