import { UserSkill } from "@/types/types";
import { cosineSimilarity } from "@/hooks/userEmbeddings";
import { supabase } from "@/app/utils/supabase/client";
import { getAuthUser } from "@/utility_methods/userUtils";
import { toast } from "sonner";
import {
  findOverlappingTimeSlots,
  convertToCalendarEvents,
} from "@/utility_methods/schedulingUtils";
import { rankSlots } from "@/app/lib/rankSlots";

export const addToSkillsArray = (
  skill: UserSkill,
  learnSkillsArray: number[][],
  teachSkillsArray: number[][]
) => {
  if (skill.type === "learn" && skill.embedding) {
    try {
      const embedding =
        typeof skill.embedding === "string"
          ? JSON.parse(skill.embedding)
          : skill.embedding;

      if (Array.isArray(embedding)) {
        learnSkillsArray.push(embedding);
      } else if (typeof embedding === "object" && embedding !== null) {
        const keys = Object.keys(embedding).sort(
          (a, b) => Number(a) - Number(b)
        );
        const embeddingArray = keys.map((key) => embedding[key]);
        learnSkillsArray.push(embeddingArray);
      }
    } catch (err) {
      alert("Error processing learn skill embedding");
    }
  } else if (skill.type === "teach" && skill.embedding) {
    try {
      const embedding =
        typeof skill.embedding === "string"
          ? JSON.parse(skill.embedding)
          : skill.embedding;

      if (Array.isArray(embedding)) {
        teachSkillsArray.push(embedding);
      } else if (typeof embedding === "object" && embedding !== null) {
        const keys = Object.keys(embedding).sort(
          (a, b) => Number(a) - Number(b)
        );
        const embeddingArray = keys.map((key) => embedding[key]);
        teachSkillsArray.push(embeddingArray);
      }
    } catch (error) {
      alert("Error processing teach skill embedding");
    }
  }
};

export const checkFriendshipStatus = async (
  memberId: string,
  setIsFriends: (value: boolean) => void,
  disableConnectionButton: (value: boolean) => void,
  setPendingRequest: (value: boolean) => void = () => {},
  setRequestSent: (value: boolean) => void = () => {},
  setRequestReceived: (value: boolean) => void = () => {}
) => {
  try {
    const user = await getAuthUser();

    if (!user) {
      toast.error("No user found");
      return;
    }

    const { data: isMutualFriends, error: rpcError } = await supabase.rpc(
      "are_friends",
      {
        owner_id: user.id,
        friend_id: memberId,
      }
    );

    if (rpcError) {
      toast.error(rpcError.message);
      return;
    }

    const { data: otherUserRequestedMe } = await supabase
      .from("friends")
      .select("*")
      .eq("owner", memberId)
      .eq("friend", user.id);

    const { data: iRequestedOtherUser } = await supabase
      .from("friends")
      .select("*")
      .eq("owner", user.id)
      .eq("friend", memberId);

    const receivedRequest =
      otherUserRequestedMe && otherUserRequestedMe.length > 0;
    const sentRequest = iRequestedOtherUser && iRequestedOtherUser.length > 0;

    setRequestReceived(!!receivedRequest);
    setRequestSent(!!sentRequest);

    const iHavePendingRequest = receivedRequest && !sentRequest;
    setPendingRequest(!!iHavePendingRequest);

    setIsFriends(!!isMutualFriends);

    disableConnectionButton(!!sentRequest);
  } catch (error) {
    toast.error("Error checking friendship status");
  }
};

export const findMaxLearnSimilarity = (
  loggedInUserLearnSkills: number[][],
  secondaryUserTeachSkills: number[][]
): number => {
  let max_learn_score = 0;

  for (let i = 0; i < loggedInUserLearnSkills.length; i++) {
    const loggedInLearnEmbedding = loggedInUserLearnSkills[i];

    for (let j = 0; j < secondaryUserTeachSkills.length; j++) {
      const otherUserTeachEmbedding = secondaryUserTeachSkills[j];
      const similarity = cosineSimilarity(
        loggedInLearnEmbedding,
        otherUserTeachEmbedding
      );

      if (similarity > max_learn_score) {
        max_learn_score = similarity;
      }
    }
  }

  return max_learn_score;
};

export const findMaxTeachSimilarity = (
  loggedInUserTeachSkills: number[][],
  secondaryUserLearnSkills: number[][]
): number => {
  let max_teach_score = 0;
  for (let i = 0; i < loggedInUserTeachSkills.length; i++) {
    const loggedInTeachEmbedding = loggedInUserTeachSkills[i];

    for (let j = 0; j < secondaryUserLearnSkills.length; j++) {
      const otherUserLearnEmbedding = secondaryUserLearnSkills[j];
      const similarity = cosineSimilarity(
        loggedInTeachEmbedding,
        otherUserLearnEmbedding
      );

      if (similarity > max_teach_score) {
        max_teach_score = similarity;
      }
    }
  }

  return max_teach_score;
};

export const getSimilarityColor = (score: number): string => {
  if (score >= 0.8) return "bg-green-500";
  if (score >= 0.6) return "bg-blue-500";
  if (score >= 0.4) return "bg-yellow-500";
  if (score >= 0.2) return "bg-orange-500";
  return "bg-red-500";
};

export const getSimilarityLabel = (score: number): string => {
  if (score >= 0.8) return "Excellent Match";
  if (score >= 0.6) return "Great Match";
  if (score >= 0.4) return "Good Match";
  if (score >= 0.2) return "Fair Match";
  return "Low Match";
};

export const areFriends = async (
  userId: string,
  targetId: string
): Promise<boolean> => {
  try {
    const { data: isMutualFriends, error: rpcError } = await supabase.rpc(
      "are_friends",
      {
        owner_id: userId,
        friend_id: targetId,
      }
    );

    if (rpcError) {
      alert("Error checking friendship status:");
      return false;
    }

    return !!isMutualFriends;
  } catch (error) {
    alert("Error checking friendship status:");
    return false;
  }
};

export const calculateUserSimilarityScores = async (
  loggedInUserId: string,
  targetUserId: string
) => {
  try {
    const { data: loggedInUserSkills } = await supabase
      .from("user_skills")
      .select("skill, type, embedding, teaching_time")
      .eq("user_id", loggedInUserId);

    const { data: targetUserSkills } = await supabase
      .from("user_skills")
      .select("skill, type, embedding, teaching_time")
      .eq("user_id", targetUserId);

    const { data: loggedInUserData } = await supabase
      .from("users")
      .select("time_zone, chronotype, availability")
      .eq("id", loggedInUserId)
      .single();

    const { data: targetUserData } = await supabase
      .from("users")
      .select("time_zone, chronotype, availability")
      .eq("id", targetUserId)
      .single();

    if (!loggedInUserSkills || !targetUserSkills) {
      return {
        max_learn_score: 0,
        max_teach_score: 0,
        teaching_hours: 0,
        matching_skill: "",
        optimal_meeting_slots: [],
      };
    }

    const loggedInUserLearnSkills: number[][] = [];
    const loggedInUserTeachSkills: number[][] = [];
    const targetUserLearnSkills: number[][] = [];
    const targetUserTeachSkills: number[][] = [];

    const targetTeachingSkillsMap = new Map();
    const loggedInTeachingSkillsMap = new Map();

    loggedInUserSkills.forEach((skill) => {
      addToSkillsArray(skill, loggedInUserLearnSkills, loggedInUserTeachSkills);
      if (skill.type === "teach" && skill.teaching_time) {
        loggedInTeachingSkillsMap.set(skill.skill, skill.teaching_time);
      }
    });

    targetUserSkills.forEach((skill) => {
      addToSkillsArray(skill, targetUserLearnSkills, targetUserTeachSkills);
      if (skill.type === "teach" && skill.teaching_time) {
        targetTeachingSkillsMap.set(skill.skill, skill.teaching_time);
      }
    });

    const max_learn_score = findMaxLearnSimilarity(
      loggedInUserLearnSkills,
      targetUserTeachSkills
    );

    const max_teach_score = findMaxTeachSimilarity(
      loggedInUserTeachSkills,
      targetUserLearnSkills
    );

    let bestMatchingSkill = "";
    let teaching_hours = 0;
    let optimal_meeting_slots: any[] = [];

    if (max_learn_score >= 0.8) {
      const loggedInUserLearnSkillsData = loggedInUserSkills.filter(
        (s) => s.type === "learn"
      );
      const targetUserTeachSkillsData = targetUserSkills.filter(
        (s) => s.type === "teach"
      );

      let highestSimilarity = 0;

      for (const learnSkill of loggedInUserLearnSkillsData) {
        for (const teachSkill of targetUserTeachSkillsData) {
          if (learnSkill.embedding && teachSkill.embedding) {
            const learnEmbedding =
              typeof learnSkill.embedding === "string"
                ? JSON.parse(learnSkill.embedding)
                : learnSkill.embedding;

            const teachEmbedding =
              typeof teachSkill.embedding === "string"
                ? JSON.parse(teachSkill.embedding)
                : teachSkill.embedding;

            const similarity = cosineSimilarity(
              Array.isArray(learnEmbedding)
                ? learnEmbedding
                : Object.values(learnEmbedding),
              Array.isArray(teachEmbedding)
                ? teachEmbedding
                : Object.values(teachEmbedding)
            );

            if (similarity > highestSimilarity) {
              highestSimilarity = similarity;
              bestMatchingSkill = teachSkill.skill;
              teaching_hours = teachSkill.teaching_time || 0;
            }
          }
        }
      }
    } else if (max_teach_score >= 0.8) {
      const loggedInUserTeachSkillsData = loggedInUserSkills.filter(
        (hostTeachSkill) => hostTeachSkill.type === "teach"
      );
      const targetUserLearnSkillsData = targetUserSkills.filter(
        (targetLearnSkill) => targetLearnSkill.type === "learn"
      );

      let highestSimilarity = 0;

      for (const teachSkill of loggedInUserTeachSkillsData) {
        for (const learnSkill of targetUserLearnSkillsData) {
          if (teachSkill.embedding && learnSkill.embedding) {
            const teachEmbedding =
              typeof teachSkill.embedding === "string"
                ? JSON.parse(teachSkill.embedding)
                : teachSkill.embedding;

            const learnEmbedding =
              typeof learnSkill.embedding === "string"
                ? JSON.parse(learnSkill.embedding)
                : learnSkill.embedding;

            const similarity = cosineSimilarity(
              Array.isArray(teachEmbedding)
                ? teachEmbedding
                : Object.values(teachEmbedding),
              Array.isArray(learnEmbedding)
                ? learnEmbedding
                : Object.values(learnEmbedding)
            );

            if (similarity > highestSimilarity) {
              highestSimilarity = similarity;
              bestMatchingSkill = teachSkill.skill;
              teaching_hours = teachSkill.teaching_time;
            }
          }
        }
      }
    }

    if (
      (max_learn_score >= 0.8 || max_teach_score >= 0.8) &&
      teaching_hours > 0 &&
      loggedInUserData &&
      targetUserData
    ) {
      try {
        const loggedInUserAvailability = loggedInUserData.availability || [];
        const targetUserAvailability = targetUserData.availability || [];

        const overlappingSlots = findOverlappingTimeSlots(
          loggedInUserAvailability,
          targetUserAvailability
        );

        if (overlappingSlots.length > 0) {
          const loggedInUserTimeZone = loggedInUserData.time_zone;
          const calendarEvents = convertToCalendarEvents(
            overlappingSlots,
            loggedInUserTimeZone
          );

          const user1 = {
            user_id: loggedInUserId,
            timezone: loggedInUserData.time_zone,
            chronotype: loggedInUserData.chronotype,
          };

          const user2 = {
            user_id: targetUserId,
            timezone: targetUserData.time_zone,
            chronotype: targetUserData.chronotype,
          };

          const slots = calendarEvents.map((event) => ({
            startUTC: event.startUTC || "",
            endUTC: event.endUTC || "",
          }));

          const rankedSlots = rankSlots(user1, user2, slots);

          optimal_meeting_slots = rankedSlots
            .slice(0, teaching_hours)
            .map((slot) => ({
              startUTC: slot.startUTC,
              endUTC: slot.endUTC,
              score: slot.score,
            }));
        }
      } catch (error) {
        alert("Error finding optimal meeting slots");
      }
    }

    return {
      max_learn_score,
      max_teach_score,
      teaching_hours,
      matching_skill: bestMatchingSkill,
      optimal_meeting_slots,
    };
  } catch (err) {
    toast.error("Error calculating scores");
    return { max_learn_score: 0, max_teach_score: 0 };
  }
};
