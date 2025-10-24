import { UserProfile } from "@/types/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProfileContentProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
}

export default function ProfileContent({
  profile,
  isOwnProfile = false,
}: ProfileContentProps) {
  return (
    <div className="px-8 py-8">
      <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">About</h3>
        <p className="mt-2 text-sm text-slate-600">
          Welcome to your profile. More details coming soon.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/dm_page">Friends</Link>
        </Button>
      </div>
    </div>
  );
}
