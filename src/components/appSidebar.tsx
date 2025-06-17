"use client";

import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { PinIcon, PinOffIcon, XIcon, UserIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

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
    if (chat.messages.length === 0) return;

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
  const deleteChat = useMutation(api.chats.deleteChat).withOptimisticUpdate(
    (localStore, { chatId }) => {
      // Get the current list of chats
      const chats = localStore.getQuery(api.chats.getChats, {});
      if (!chats) return;

      // Update the local state optimistically
      localStore.setQuery(
        api.chats.getChats,
        {},
        chats.filter((chat) => chat._id !== chatId),
      );
    },
  );
  const pinChat = useMutation(api.chats.pinChat).withOptimisticUpdate(
    (localStore, { chatId, pinned }) => {
      // Get the current list of chats
      const chats = localStore.getQuery(api.chats.getChats, {});
      if (!chats) return;

      // Update the local state optimistically
      localStore.setQuery(
        api.chats.getChats,
        {},
        chats.map((chat) => ({
          ...chat,
          pinned: chat._id === chatId ? pinned : chat.pinned,
        })),
      );
    },
  );
  const router = useRouter();
  const handleDelete = async () => {
    try {
      await deleteChat({ chatId: props.chat._id });
      if (props.currentChatId === props.chat._id) {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  return (
    <li
      className={cn(
        "group/link w-full relative overflow-hidden py-2 px-3 hover:bg-pink-300 truncate block rounded-md cursor-pointer",
        props.chat._id === props.currentChatId && "bg-pink-300",
      )}
      onClick={(e) => {
        router.push(`/chat/${props.chat._id}`);
      }}
    >
      <MouseDownLink href={`/chat/${props.chat._id}`}>
        {props.chat.title || "..."}
      </MouseDownLink>
      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/link:opacity-100 group-hover/link:bg-pink-300">
        <div className="pointer-events-none absolute bottom-0 right-[100%] top-0 w-8 bg-gradient-to-l from-transparent group-hover/link:from-pink-300 to-transparent"></div>
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
          onClick={handleDelete}
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
        <div
          className={cn("grid place-items-center rounded-md", props.className)}
          onClick={props.onClick}
        >
          {props.children}
        </div>
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

export function AppSidebar(props: { chatId: string | undefined }) {
  const { user } = useUser();
  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.username?.[0]?.toUpperCase() || "U";

  return (
    <Sidebar>
      <SidebarHeader className={"px-3 py-4"}>
        <h1 className="text-2xl font-bold text-pink-600 text-center">
          R6 Chat
        </h1>
        <Button asChild className={"bg-pink-300 text-center text-white"}>
          <MouseDownLink href="/chat/">New Chat</MouseDownLink>
        </Button>
      </SidebarHeader>
      <SidebarContent className={"px-3"}>
        <Chats currentChatId={props.chatId as Id<"chats">} />
      </SidebarContent>
      <SidebarFooter className="mt-auto pt-4 px-3 pb-4">
        <SignedIn>
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start h-auto py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MouseDownLink
              href="/profile"
              className="flex items-center gap-3 w-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.imageUrl}
                  alt={user?.fullName || user?.username || "User"}
                />
                <AvatarFallback className="text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left overflow-hidden">
                <p className="font-medium text-sm truncate">
                  {user?.fullName || user?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  View profile
                </p>
              </div>
            </MouseDownLink>
          </Button>
        </SignedIn>
        <SignedOut>
          <div className="space-y-2">
            <Button asChild variant="default" className="w-full">
              <SignInButton mode="modal" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{" "}
              <SignUpButton mode="modal">
                <button className="text-pink-500 hover:underline">
                  Sign up
                </button>
              </SignUpButton>
            </p>
          </div>
        </SignedOut>
      </SidebarFooter>
    </Sidebar>
  );
}
