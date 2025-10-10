"use client";
import React, { useEffect, useState, useRef } from "react";
import { ListOfMessages } from "@/types/types";
import { supabase } from "@/app/utils/supabase/client";

export default function ListMessages({ messages }: ListOfMessages) {
  const [userData, setUserData] = useState<{
    [key: string]: { name: string; profilePic?: string };
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUserDataForMessages = async () => {
      const userIds = messages.map((message) => message.sent_by);
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, profile_pic_url")
        .in("id", userIds);

      if (error) {
        alert("Error Fetching User Data");
        return [];
      }
      const userDataMap = data.reduce(
        (
          acc: { [key: string]: { name: string; profilePic?: string } },
          user
        ) => {
          acc[user.id] = {
            name: user.display_name,
            profilePic: user.profile_pic_url,
          };
          return acc;
        },
        {}
      );

      setUserData(userDataMap);
    };

    fetchUserDataForMessages();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="flex-1"></div>
      <div className="space-y-7">
        {messages.map((message, index) => {
          return (
            <div key={index} className="flex gap-2">
              <div className="h-10 w-10 rounded-full overflow-hidden">
                {userData[message.sent_by]?.profilePic ? (
                  <img
                    src={userData[message.sent_by].profilePic}
                    alt={`${userData[message.sent_by].name}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userData[message.sent_by]?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <h1 className="font-bold">
                    {userData[message.sent_by]?.name}
                  </h1>

                  <h1 className="text-sm text-gray-400">
                    {new Date(message.created_at).toDateString()}
                  </h1>
                </div>
                <p className="text-gray-300">{message.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
