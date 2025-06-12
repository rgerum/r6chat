"use client";

import { Message, useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Id } from "../../convex/_generated/dataModel";

function Chats() {
  const chats = useQuery(api.chats.getChats);
  if (!chats) return null;
  return (
    <ul>
      {chats.map((chat) => (
        <li key={chat._id}>
          <Link href={`/chat/${chat._id}`}>{chat.title}</Link>
        </li>
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
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
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
    <>
      <button onClick={() => addChat({ title: "New Chat" })}>Add Chat</button>
      <Chats />
      {props.chatId && (
        <ChatHistoryWrapper chatId={props.chatId as Id<"chats">} />
      )}{" "}
    </>
  );
}
