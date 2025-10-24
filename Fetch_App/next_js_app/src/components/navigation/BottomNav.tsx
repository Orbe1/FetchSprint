"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, MessageSquare, User, Plus, SquarePen } from "lucide-react";
import supabase from "@/app/utils/supabase/client";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (href: string) => pathname === href;

  // Hide bottom nav on pages where it gets in the way.
  // Show it on the messages landing view, but hide for in-thread view.
  const inDmThread = pathname?.startsWith("/dm_page") && Boolean(searchParams?.get("id"));
  if (pathname && inDmThread) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="relative mx-auto flex max-w-3xl items-center justify-around p-2">
        <button
          type="button"
          onClick={() => router.push("/feed")}
          className={`flex flex-col items-center gap-1 text-xs ${
            isActive("/feed") ? "text-[var(--primary)]" : "text-slate-500"
          }`}
          aria-label="Feed"
        >
          <Home size={22} />
          <span>Feed</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/create_post")}
          className={`flex flex-col items-center gap-1 text-xs ${
            isActive("/create_post") ? "text-[var(--primary)]" : "text-slate-500"
          }`}
          aria-label="Post"
        >
          <SquarePen size={22} />
          <span>Post</span>
        </button>

        <div className="-translate-y-6">
          <button
            type="button"
            onClick={() => router.push("/receipt")}
            className="grid h-16 w-16 place-items-center rounded-full bg-[var(--primary)] text-white shadow-lg ring-4 ring-white"
            aria-label="Scan or Upload Receipt"
          >
            <Plus size={28} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dm_page")}
          className={`flex flex-col items-center gap-1 text-xs ${
            isActive("/dm_page") ? "text-[var(--primary)]" : "text-slate-500"
          }`}
          aria-label="Messages"
        >
          <MessageSquare size={22} />
          <span>Messages</span>
        </button>

        <button
          type="button"
          onClick={async () => { const { data: { session } } = await supabase().auth.getSession(); if (!session) { router.push("/login?next=/profile_page"); return; } router.push("/profile_page"); }}
          className={`flex flex-col items-center gap-1 text-xs ${
            isActive("/profile_page") ? "text-[var(--primary)]" : "text-slate-500"
          }`}
          aria-label="Profile"
        >
          <User size={22} />
          <span>Profile</span>
        </button>
      </div>
    </nav>
  );
}



