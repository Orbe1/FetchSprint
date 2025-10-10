import React, { Suspense } from "react";
import ListMessages from "./ListMessages";
import { Message } from "@/types/types";

interface ChatMessageProps {
  messages: Message[];
}

export default function ChatMessage({ messages }: ChatMessageProps) {
  return (
    <Suspense fallback={"loading..."}>
      <ListMessages messages={messages} />
    </Suspense>
  );
}
