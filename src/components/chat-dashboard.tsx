"use client";

import { Message, useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";

// First, let's define a type for our chat object
type Chat = {
  _id: Id<"chats">;
  userId: string;
  title?: string;
  messages: string[];
  lastUpdate?: number; // Note: This is optional in your schema
};

// Update the groupChats function
function groupChats(chats: Chat[]) {
  // Get current date
  const now = new Date();

  // Initialize categories with proper types
  const groupedChats = {
    Today: [] as Chat[],
    Yesterday: [] as Chat[],
    "Last 30 Days": [] as Chat[],
    Older: [] as Chat[],
  };

  // Group chats based on lastUpdate
  chats.forEach((chat) => {
    // Skip if lastUpdate is not set
    if (!chat.lastUpdate) return;

    const chatDate = new Date(chat.lastUpdate);
    const chatDateString = chatDate.toDateString();
    const todayString = now.toDateString();
    const yesterdayString = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toDateString();

    if (chatDateString === todayString) {
      groupedChats.Today.push(chat);
    } else if (chatDateString === yesterdayString) {
      groupedChats.Yesterday.push(chat);
    } else if (now.getTime() - chatDate.getTime() <= 30 * 24 * 60 * 60 * 1000) {
      groupedChats["Last 30 Days"].push(chat);
    } else {
      groupedChats.Older.push(chat);
    }
  });

  return groupedChats;
}

function Chats() {
  const chats = useQuery(api.chats.getChats);
  if (!chats) return null;

  const groupedChats = groupChats(
    chats, //.filter((chat) => chat.messages.length > 0),
  );
  return (
    <ul>
      {Object.entries(groupedChats).map(([category, chats], chatId) => (
        <div key={chatId} className="text-xs mt-4 overflow-hidden">
          <h2 className="font-bold mb-1 px-1">{category}</h2>
          <ul className="w-full space-y-1">
            {chats.map((chat) => (
              <li key={chat._id} className="w-full">
                <Link
                  href={`/chat/${chat._id}`}
                  className={
                    "py-2 px-3 hover:bg-pink-300 truncate w-full block rounded-md"
                  }
                >
                  {chat.title || "..."}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </ul>
  );
}

function ChatText(props: { chatId: Id<"chats">; initialMessages?: Message[] }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    id: props.chatId,
    initialMessages: props.initialMessages,
    sendExtraMessageFields: true,
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return (
                  <div
                    key={`${message.id}-${i}`}
                    className={cn(
                      "mb-8",
                      message.role === "user"
                        ? "bg-pink-200 rounded-md p-3 ml-30"
                        : "",
                    )}
                  >
                    {part.text}
                  </div>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 w-full max-w-md border-5 border-b-0 border-pink-500 rounded-t-md bg-pink-100"
      >
        <input
          className=" w-full p-2 mb-8"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}

function ChatHistoryWrapper(props: { chatId: Id<"chats"> }) {
  const chatHistory = useQuery(api.chats.getChat, {
    chatId: props.chatId,
  });
  return (
    <ChatText
      chatId={props.chatId as Id<"chats">}
      initialMessages={chatHistory?.messages.map(
        (m) => JSON.parse(m) as Message,
      )}
    />
  );
}

export default function ChatDashboard(props: { chatId?: string }) {
  const addChat = useMutation(api.chats.addChat);

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col max-w-[256px] px-3 py-4 bg-pink-100 fixed h-screen">
        <Button asChild className={"bg-pink-300 text-center text-white"}>
          <Link href="/">New Chat</Link>
        </Button>
        <Chats />

        <footer className="mt-auto">
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </footer>
      </div>
      <div className={" ml-[256px] w-full"}>
        {props.chatId && (
          <ChatHistoryWrapper chatId={props.chatId as Id<"chats">} />
        )}
      </div>
    </div>
  );
}
