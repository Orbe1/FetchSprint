import { useState, useEffect } from "react";
import { calculateUserSimilarityScores } from "@/utility_methods/memberCardUtils";
import { LoggedInUser, Member } from "@/types/types";

export function useMemberSimilarity(
  memberId: string,
  loggedInUser: LoggedInUser | Member | null | undefined,
  loggedInUserId: string = ""
) {
  const [maxLearnScore, setMaxLearnScore] = useState<number>(0);
  const [maxTeachScore, setMaxTeachScore] = useState<number>(0);

  useEffect(() => {
    const calculateSimilarityScores = async () => {
      if (!loggedInUser || loggedInUserId === memberId) return;

      try {
        const { max_learn_score, max_teach_score } =
          await calculateUserSimilarityScores(loggedInUser.id, memberId);

        setMaxLearnScore(max_learn_score);
        setMaxTeachScore(max_teach_score);
      } catch (error) {
        alert("Error calculating similarity scores");
      }
    };

    calculateSimilarityScores();
  }, [loggedInUser, memberId, loggedInUserId]);

  return {
    maxLearnScore,
    maxTeachScore,
  };
}
