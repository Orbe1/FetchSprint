"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/app/utils/supabase/client";
import { toast } from "sonner";
import { getAuthUser } from "@/utility_methods/userUtils";

export default function ChatInput({
  refreshMessages,
}: {
  refreshMessages: () => void;
}) {
  const sendMessage = async (text: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    const convo_id = searchParams.get("id");

    const user = await getAuthUser();

    if (!user) {
      toast.error("You must be logged in to send messages");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      text,
      sent_by: user.id,
      conversation_id: convo_id,
    });

    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success("Message sent!");
      refreshMessages();
    }
  };

  return (
    <div className="p-5">
      <Input
        placeholder="send-msg"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
