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
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { PinIcon, PinOffIcon, XIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Update the groupChats function
function groupChats(chats: Chat[]) {
  // Get current date
  const now = new Date();

  // Initialize categories with proper types
  const groupedChats = {
    Pinned: [] as Chat[],
    Today: [] as Chat[],
    Yesterday: [] as Chat[],
    "Last 30 Days": [] as Chat[],
    Older: [] as Chat[],
  };

  // Group chats based on lastUpdate
  chats.forEach((chat) => {
    // Skip if lastUpdate is not set
    if (!chat.lastUpdate) return;

    if (chat.pinned) {
      groupedChats.Pinned.push(chat);
      return;
    }

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

function MouseDownLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onMouseDown={(e) => {
        e.preventDefault();
        router.push(href);
      }}
      onClick={(e) => {
        e.preventDefault();
      }}
      className={className}
    >
      {children}
    </Link>
  );
}

function ChatLink(props: {
  chat: Chat;
  currentChatId: Id<"chats"> | undefined;
}) {
  const [hover, setHover] = React.useState(false);
  const deleteChat = useMutation(api.chats.deleteChat);
  const pinChat = useMutation(api.chats.pinChat);
  const router = useRouter();

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "w-full relative overflow-hidden py-2 px-3 hover:bg-pink-300 truncate block rounded-md cursor-pointer",
        props.chat._id === props.currentChatId && "bg-pink-300",
      )}
      onClick={(e) => {
        router.push(`/chat/${props.chat._id}`);
      }}
    >
      <MouseDownLink href={`/chat/${props.chat._id}`}>
        {props.chat.title || "..."}
      </MouseDownLink>
      <div
        className={cn(
          "absolute right-1 top-1/2 transform transition-opacity -translate-y-1/2 ",
          !hover && "opacity-0  bg-transparent",
          hover && " bg-pink-300 opacity-100",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute bottom-0 right-[100%] top-0 w-8 bg-gradient-to-l from-pink-300 to-transparent ",
            !hover && "from-transparent",
          )}
        ></div>
        <ButtonWithTooltip
          className={" h-6 w-6 hover:bg-pink-200 bg-transparent"}
          onClick={() =>
            pinChat({
              chatId: props.chat._id,
              pinned: !props.chat.pinned,
            })
          }
          tooltipMessage={props.chat.pinned ? "Unpin Chat" : "Pin Chat"}
        >
          {props.chat.pinned ? (
            <PinOffIcon className="w-4 h-4" />
          ) : (
            <PinIcon className="w-4 h-4" />
          )}
        </ButtonWithTooltip>
        <ButtonWithTooltip
          className={" h-6 w-6 hover:bg-pink-200 bg-transparent"}
          onClick={() => deleteChat({ chatId: props.chat._id })}
          tooltipMessage={"Delete Chat"}
        >
          <XIcon className="w-4 h-4" />
        </ButtonWithTooltip>
      </div>
    </li>
  );
}

function ButtonWithTooltip(props: {
  children: React.ReactNode;
  className: string;
  onClick?: () => void;
  tooltipMessage?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button className={props.className} onClick={props.onClick}>
          {props.children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{props.tooltipMessage}</TooltipContent>
    </Tooltip>
  );
}

type Chat = NonNullable<Awaited<ReturnType<typeof useChats>>>[number];

function useChats() {
  return useQuery(api.chats.getChats);
}

function Chats({ currentChatId }: { currentChatId?: Id<"chats"> }) {
  const chats = useChats();
  if (!chats) return null;

  const groupedChats = groupChats(
    chats, //.filter((chat) => chat.messages.length > 0),
  );
  return (
    <ul>
      {Object.entries(groupedChats).map(([category, chats], chatId) => (
        <React.Fragment key={chatId}>
          {chats.length > 0 && (
            <div key={chatId} className="text-xs mt-6 overflow-hidden">
              <h2 className="font-bold mb-1 px-1">
                {category == "Pinned" && (
                  <PinIcon className="w-3 h-3 inline-block mr-1" />
                )}
                {category}
              </h2>
              <ul className="w-full space-y-1">
                {chats.map((chat) => (
                  <ChatLink
                    key={chat._id}
                    chat={chat}
                    currentChatId={currentChatId}
                  />
                ))}
              </ul>
            </div>
          )}
        </React.Fragment>
      ))}
    </ul>
  );
}

export function Sidebar(props: { chatId: string | undefined }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4 text-pink-600 text-center">
        R6 Chat
      </h1>
      <Button asChild className={"bg-pink-300 text-center text-white"}>
        <MouseDownLink href="/chat/">New Chat</MouseDownLink>
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
