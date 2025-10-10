import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { checkFriendshipStatus } from "@/utility_methods/memberCardUtils";
import { getAuthUser } from "@/utility_methods/userUtils";
import { toast } from "sonner";

export function useMemberInteractions(memberId: string) {
  const [isDisabled, setIsDisabled] = useState(false);
  const [isFriends, setIsFriends] = useState(false);
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestReceived, setRequestReceived] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkFriendshipStatus(
      memberId,
      setIsFriends,
      setIsDisabled,
      setIsPendingRequest,
      setRequestSent,
      setRequestReceived
    );
  }, [memberId]);

  const sendConnectionRequest = async () => {
    try {
      const user = await getAuthUser();

      // Check if this is accepting a connection request
      const isAcceptingRequest = requestReceived && !requestSent;

      await supabase
        .from("friends")
        .insert({ owner: user?.id, friend: memberId });

      await checkFriendshipStatus(
        memberId,
        setIsFriends,
        setIsDisabled,
        setIsPendingRequest,
        setRequestSent,
        setRequestReceived
      );

      if (isAcceptingRequest) {
        try {
          const { data: userSkills } = await supabase
            .from("user_skills")
            .select("skill")
            .eq("user_id", memberId)
            .eq("type", "teach");

          if (userSkills && userSkills.length > 0) {
            const randomSkill =
              userSkills[Math.floor(Math.random() * userSkills.length)].skill;

            const { data } = await supabase
              .from("dm_conversations")
              .select("*")
              .or(
                `and(user1_id.eq.${user?.id},user2_id.eq.${memberId}),and(user1_id.eq.${memberId},user2_id.eq.${user?.id})`
              )
              .limit(1);

            let convoId = data?.[0]?.id;

            if (!data || data.length === 0) {
              const { data: newConvo, error: insertError } = await supabase
                .from("dm_conversations")
                .insert({ user1_id: user?.id, user2_id: memberId })
                .select();

              if (insertError) {
                toast.error(
                  `Error creating conversation: ${insertError.message}`
                );
                return;
              }

              convoId = newConvo?.[0]?.id;
            }

            const iceBreaker = `How did you first get into ${randomSkill}?`;

            const { error } = await supabase.from("messages").insert({
              text: iceBreaker,
              sent_by: user?.id,
              conversation_id: convoId,
            });

            if (error) {
              toast.error(`Error sending ice breaker: ${error.message}`);
            }
          }
        } catch (error) {
          console.error("Error sending ice breaker:", error);
        }
      }
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const viewProfile = () => {
    router.push(`/profile_page?id=${memberId}`);
  };

  const enterDM = async (memberName: string) => {
    try {
      const user = await getAuthUser();

      const { data } = await supabase
        .from("dm_conversations")
        .select("*")
        .or(
          `and(user1_id.eq.${user?.id},user2_id.eq.${memberId}),and(user1_id.eq.${memberId},user2_id.eq.${user?.id})`
        )
        .limit(1);

      let convoId = data?.[0]?.id;

      if (!data || data.length === 0) {
        const { data: newConvo, error: insertError } = await supabase
          .from("dm_conversations")
          .insert({ user1_id: user?.id, user2_id: memberId })
          .select();

        if (insertError) {
          alert(insertError);
          return;
        }

        convoId = newConvo?.[0]?.id;
      }

      router.push(
        `/dm_page?id=${convoId}&user=${memberName}&userId=${memberId}`
      );
    } catch (error) {
      alert(error);
    }
  };

  const scheduleMeeting = () => {
    router.push(`/meetings?userId=${memberId}`);
  };

  return {
    isDisabled,
    isFriends,
    isPendingRequest,
    requestSent,
    requestReceived,
    sendConnectionRequest,
    viewProfile,
    enterDM,
    scheduleMeeting,
  };
}
