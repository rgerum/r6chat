"use client";

import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import React from "react";
import { useRouter } from "next/navigation";

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

function Chats({ currentChatId }: { currentChatId?: Id<"chats"> }) {
  const chats = useQuery(api.chats.getChats);
  if (!chats) return null;

  const groupedChats = groupChats(
    chats, //.filter((chat) => chat.messages.length > 0),
  );
  const router = useRouter();
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    router.push(`/chat/${chat._id}`);
                  }}
                  className={cn(
                    "py-2 px-3 hover:bg-pink-300 truncate w-full block rounded-md",
                    chat._id === currentChatId && "bg-pink-300",
                  )}
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

export function Sidebar(props: { chatId: string | undefined }) {
  return (
    <>
      <Button asChild className={"bg-pink-300 text-center text-white"}>
        <Link href="/chat/">New Chat</Link>
      </Button>
      <Chats currentChatId={props.chatId as Id<"chats">} />

      <footer className="mt-auto">
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </footer>
    </>
  );
}
