"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabase/client";
import HomeButton from "@/components/homeButton";
import { MemberWithSimilarity, LoggedInUser } from "@/types/types";
import { getFormattedUser } from "@/utility_methods/userUtils";
import { calculateUserSimilarityScores } from "@/utility_methods/memberCardUtils";
import LearnPageMemberCards from "./LearnPageMemberCards";

export default function LearnPage() {
  const [members, setMembers] = useState<MemberWithSimilarity[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "learn" | "teach">("all");

  useEffect(() => {
    getFormattedUser(setLoggedInUser);
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!loggedInUser) return;
      setLoading(true);

      try {
        const { data: users, error } = await supabase
          .from("users")
          .select("*")
          .eq("completed_onboarding", true)
          .neq("id", loggedInUser.id);

        if (error) {
          alert("Error fetching users:");
          setLoading(false);
          return;
        }

        const usersWithTags = await Promise.all(
          users.map(async (user) => {
            const { max_learn_score, max_teach_score } =
              await calculateUserSimilarityScores(loggedInUser.id, user.id);

            return {
              id: user.id,
              name: user.display_name,
              email: user.email,
              profilePicUrl: user.profile_pic_url,
              maxLearnScore: max_learn_score,
              maxTeachScore: max_teach_score,
            };
          })
        );

        if (filter === "learn") {
          const filteredMembers = usersWithTags.filter(
            (member) =>
              member.maxLearnScore !== undefined && member.maxLearnScore >= 0.7
          );
          setMembers(filteredMembers);
        } else if (filter === "teach") {
          const filteredMembers = usersWithTags.filter(
            (member) =>
              member.maxTeachScore !== undefined && member.maxTeachScore >= 0.85
          );
          setMembers(filteredMembers);
        } else {
          setMembers(usersWithTags);
        }
      } catch (error) {
        alert("Error fetching users: " + error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [loggedInUser, filter]);

  return (
    <div className="max-w-6xl mx-auto md:py-10 h-screen relative">
      <div className="fixed top-4 left-4 z-10">
        <HomeButton />
      </div>

      <div className="h-full border rounded-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-white-900 mb-2">
            Learning Connections
          </h1>
          <p className="text-white-600 mb-4">
            Find people who are good matches for learning and teaching
          </p>

          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Members
            </button>
            <button
              onClick={() => setFilter("learn")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === "learn"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Good to Learn From
            </button>
            <button
              onClick={() => setFilter("teach")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === "teach"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Good to Teach
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">
                👥 No matches found
              </div>
              <div className="text-gray-400 text-sm">
                {filter === "all"
                  ? "Try adding more skills to your profile to find better matches"
                  : filter === "learn"
                  ? "No members found who are good matches for you to learn from"
                  : "No members found who are good matches for you to teach"}
              </div>
            </div>
          </div>
        ) : (
          <LearnPageMemberCards members={members} />
        )}
      </div>
    </div>
  );
}
