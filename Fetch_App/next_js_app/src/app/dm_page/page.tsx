"use client";
import React, { useState, useEffect, useCallback } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import { supabase } from "@/app/utils/supabase/client";
import { Message } from "@/types/types";
import { toast } from "sonner";

export default function DmPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [isListUpdated, setIsListUpdated] = useState(true);
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setConvoId(params.get("id"));
    setName(params.get("user") || "");
    const userId = params.get("userId");
    setUserId(userId);

    if (userId) {
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("profile_pic_url")
          .eq("id", userId)
          .single();

        if (data && !error) {
          setProfilePicUrl(data.profile_pic_url);
        } else {
          toast.error(`Error: ${error.message}`);
        }
      };

      fetchUserProfile();
    }

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          setIsListUpdated(false);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("created_at, text, sent_by")
      .eq("conversation_id", convoId);

    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      setMessages(data);
      setIsListUpdated(true);
    }
  }, [convoId]);

  useEffect(() => {
    fetchMessages();
  }, [convoId, isListUpdated, fetchMessages]);

  return (
    <div className="max-w-3xl mx-auto md:py-10 h-screen">
      <div className=" h-full border rounded-md flex flex-col ">
        <ChatHeader name={name} profilePicUrl={profilePicUrl} />
        <ChatMessage messages={messages} />
        <ChatInput refreshMessages={fetchMessages} />
      </div>
    </div>
  );
}
