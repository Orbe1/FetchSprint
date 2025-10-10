"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { MemberWithSimilarity } from "@/types/types";
import { calculateUserSimilarityScores } from "@/utility_methods/memberCardUtils";
import { getAuthUser } from "@/utility_methods/userUtils";
import { toast } from "sonner";

const LEARN_THRESHOLD = 0.8;
const TEACH_THRESHOLD = 0.8;

export default function TopMatchesSidebar() {
  const [matches, setMatches] = useState<MemberWithSimilarity[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const user = await getAuthUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: users } = await supabase
          .from("users")
          .select("id, display_name, email, profile_pic_url")
          .eq("completed_onboarding", true)
          .neq("id", user.id)
          .limit(15);

        if (!users?.length) {
          setLoading(false);
          setMatches([]);
          return;
        }

        const usersWithScores = await Promise.all(
          users.map(async (targetUser) => {
            try {
              const { max_learn_score, max_teach_score } =
                await calculateUserSimilarityScores(user.id, targetUser.id);

              return {
                id: targetUser.id,
                name: targetUser.display_name,
                email: targetUser.email,
                profilePicUrl: targetUser.profile_pic_url,
                maxLearnScore: max_learn_score,
                maxTeachScore: max_teach_score,
              };
            } catch (error) {
              toast.error(`Error calculating similarity: ${error}`);
              return null;
            }
          })
        );

        const goodMatches = usersWithScores
          .filter(
            (user) =>
              user &&
              ((user.maxLearnScore !== undefined &&
                user.maxLearnScore >= LEARN_THRESHOLD) ||
                (user.maxTeachScore !== undefined &&
                  user.maxTeachScore >= TEACH_THRESHOLD))
          )
          .sort(
            (a, b) =>
              Math.max(b?.maxLearnScore || 0, b?.maxTeachScore || 0) -
              Math.max(a?.maxLearnScore || 0, a?.maxTeachScore || 0)
          );

        setMatches((goodMatches as MemberWithSimilarity[]).slice(0, 10));
      } catch (error) {
        toast.error("Error fetching matches");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="w-80 bg-black border-l border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Learning Matches</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="w-80 bg-black border-l border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Learning Matches</h2>
        </div>
        <div className="text-center text-gray-300 py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm text-gray-300">No learning matches found</p>
          <p className="text-xs text-gray-400 mt-1">Try adding more skills</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-black border-l border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Learning Matches</h2>
      </div>
      <div
        className="space-y-4 h-[400px] overflow-y-auto pr-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#9ca3af #f3f4f6" }}
      >
        {matches.map((match) => (
          <div
            key={match.id}
            className="border rounded-lg p-3 hover:shadow-md cursor-pointer"
            onClick={() => router.push(`/profile_page?id=${match.id}`)}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  match.profilePicUrl
                    ? ""
                    : "bg-gradient-to-br from-blue-400 to-purple-500"
                }`}
              >
                {match.profilePicUrl ? (
                  <img
                    src={match.profilePicUrl}
                    alt={match.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white font-semibold">
                    {match.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">
                  {match.name}
                </h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {match.maxLearnScore !== undefined &&
                match.maxLearnScore >= LEARN_THRESHOLD && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    🎓 Learn From
                  </div>
                )}
              {match.maxTeachScore !== undefined &&
                match.maxTeachScore >= TEACH_THRESHOLD && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    👨‍🏫 Teach
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => router.push("/learn_page")}
          className="w-full text-sm text-blue-500 hover:text-blue-700"
        >
          View All Learning Matches →
        </button>
      </div>
    </div>
  );
}
