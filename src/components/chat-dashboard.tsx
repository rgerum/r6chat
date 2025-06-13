"use client";

import { Message, useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
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
import React from "react";

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

function ChatText(props: { chatId: Id<"chats">; initialMessages?: Message[] }) {
  const [model, setModel] = React.useState("gemini-2.5-flash-preview-05-20");
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    id: props.chatId,
    initialMessages: props.initialMessages,
    sendExtraMessageFields: true,
    body: { model },
  });

  React.useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth", // Optional: adds smooth scrolling
    });
  }, [
    messages
      .map((m) =>
        m.parts.map((p) => (p.type === "text" ? p.text : "")).join(""),
      )
      .join(""),
  ]);

  return (
    <div className="flex flex-col w-full max-w-lg py-24 mx-auto stretch">
      {messages.map((message) => (
        <React.Fragment key={message.id}>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return (
                  <div
                    key={`${message.id}-${i}`}
                    className={cn(
                      "mb-8 prose",
                      message.role === "user"
                        ? "bg-pink-200 rounded-md p-3 ml-auto max-w-80 w-fit"
                        : "",
                    )}
                  >
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                );
            }
          })}
        </React.Fragment>
      ))}

      <form
        onSubmit={handleSubmit}
        className="box-content -ml-3 fixed bottom-0 w-full max-w-lg border-10 border-b-0 border-pink-100 rounded-t-md bg-pink-50"
      >
        <input
          className=" w-full p-2 mb-8"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
        <SelectScrollable model={model} setModel={setModel} />
      </form>
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { models_definitions } from "@/lib/model-definitions";

export function SelectScrollable({
  model,
  setModel,
}: {
  model: string;
  setModel: (model: string) => void;
}) {
  return (
    <Select value={model} onValueChange={setModel}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        {models_definitions.map((definition) => (
          <SelectGroup key={definition.label}>
            <SelectLabel>{definition.label}</SelectLabel>
            {definition.options.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
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
      </div>
      <div className={" ml-[256px] w-full"}>
        {props.chatId && (
          <ChatHistoryWrapper chatId={props.chatId as Id<"chats">} />
        )}
      </div>
    </div>
  );
}
