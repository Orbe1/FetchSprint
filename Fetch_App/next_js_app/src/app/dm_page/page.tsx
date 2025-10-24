"use client";
import React, { useState, useEffect, useCallback } from "react";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import { supabase } from "@/app/utils/supabase/client";
import { Message } from "@/types/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DmPage() {
  const router = useRouter();
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
    if (!convoId) return;
    const CANDIDATES = [
      "conversation_id",
      "convo_id",
      "conversationId",
      "dm_conversation_id",
    ];

    let lastErr: any = null;
    for (const col of CANDIDATES) {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq(col, convoId)
        .order("created_at", { ascending: true });

      if (!error) {
        setMessages(data ?? []);
        setIsListUpdated(true);
        return;
      }
      lastErr = error;
    }

    if (lastErr) {
      toast.error(`Error loading messages`, {
        description: lastErr.message,
      });
    }
  }, [convoId]);

  useEffect(() => {
    fetchMessages();
  }, [convoId, isListUpdated, fetchMessages]);

  return (
    <div className="max-w-3xl mx-auto md:py-10 h-screen">
      <div className=" h-full border rounded-md flex flex-col ">
        <ChatHeader name={name} profilePicUrl={profilePicUrl} />
        
        {convoId ? (<>
          <ChatMessage messages={messages} />
            <ChatInput refreshMessages={fetchMessages} />
        </>) : (
          <div className="p-6">
            <div className="mx-auto w-full max-w-2xl">
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="mb-4 text-center">
                  <p className="text-sm font-medium text-slate-700">Your Messages</p>
                  <p className="text-xs text-slate-500">This is a preview of how DMs look</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="self-start max-w-[75%] rounded-2xl bg-slate-100 px-4 py-2 text-slate-700 shadow-sm">
                    <p>Welcome to your inbox!</p>
                  </div>
                  <div className="self-end max-w-[75%] rounded-2xl bg-[var(--primary)] px-4 py-2 text-white shadow-sm">
                    <p>Send a message to get started.</p>
                  </div>
                  <div className="self-start max-w-[75%] rounded-2xl bg-slate-100 px-4 py-2 text-slate-700 shadow-sm">
                    <p>Tap a friend to open the thread.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}









