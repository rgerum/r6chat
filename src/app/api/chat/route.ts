// Allow streaming responses up to 30 seconds
import { fetchMutation, fetchQuery } from "convex/nextjs";

export const maxDuration = 30;

import { openai } from "@ai-sdk/openai";
import {
  appendResponseMessages,
  FilePart,
  streamText,
  TextPart,
  ToolCallPart,
} from "ai";

class RedactedReasoningPart {}

class ReasoningPart {}

function getText(
  messages: {
    role: string;
    content:
      | (
          | TextPart
          | FilePart
          | ReasoningPart
          | RedactedReasoningPart
          | ToolCallPart
        )[]
      | string;
  }[],
) {
  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }
    if (typeof message.content === "string") {
      return message.content;
    } else {
      for (const part of message.content) {
        if ("type" in part && part.type === "text") {
          return part.text;
        }
      }
    }
  }
}

export async function POST(req: Request) {
  const { messages, id, model } = await req.json();

  const token = await getAuthToken();

  console.log("model", model);

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const provider = getModelProvider(model);
  if (!provider) return new Response("Unknown model", { status: 401 });

  const apiKey = await fetchQuery(
    api.userApiKeys.getApiKey,
    { modelProvider: provider },
    { token },
  );
  if (!apiKey) return new Response("No key provided", { status: 401 });

  const title = await fetchQuery(
    api.chats.getChatTitle,
    {
      chatId: id as Id<"chats">,
    },
    {
      token,
    },
  );

  const modelInstance = getModelInstance(model, { apiKey });
  if (!modelInstance) throw new Error("model not found");

  // trigger the response now but await it later
  const saveChatPromise = saveChat({
    id,
    token,
    messages,
  });
  after(async () => saveChatPromise);

  if (!title) {
    const result = streamText({
      model: modelInstance,
      prompt: "Create a title for this conversation: " + messages[0].content,
      async onFinish({ response }) {
        const title = getText(response.messages);
        if (!title) return;
        await saveTitle({
          id,
          token,
          title,
        });
      },
    });
    void result.consumeStream();
  }

  const result = streamText({
    model: modelInstance,
    messages,
    async onFinish({ response }) {
      await saveChat({
        id,
        token,
        messages: appendResponseMessages({
          messages,
          responseMessages: response.messages,
        }),
      });
    },
  });

  return result.toDataStreamResponse();
}

import { Message } from "ai";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { getAuthToken } from "@/app/auth";
import { getModelInstance, getModelProvider } from "@/lib/model-instance";
import { after } from "next/server";

export async function saveTitle({
  id,
  title,
  token,
}: {
  id: string; // chats;
  title: string;
  token: string;
}): Promise<void> {
  title = title.replace(/^"|"$/g, "");
  await fetchMutation(
    api.chats.addTitleToChat,
    {
      chatId: id as Id<"chats">,
      title,
    },
    { token },
  );
}

export async function saveChat({
  id,
  messages,
  token,
}: {
  id: string; // chats;
  messages: Message[];
  token: string;
}): Promise<void> {
  await fetchMutation(
    api.chats.addMessageToChat,
    {
      chatId: id as Id<"chats">,
      messages: messages.map((m) => JSON.stringify(m, null, 2)),
    },
    { token },
  );
}
