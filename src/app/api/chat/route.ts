// Allow streaming responses up to 30 seconds
import { fetchMutation, fetchQuery } from "convex/nextjs";

export const maxDuration = 30;

import { openai } from "@ai-sdk/openai";
import {
  appendResponseMessages,
  FilePart,
  generateText,
  streamText,
  TextPart,
  ToolCallPart,
  ToolSet,
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
  const { messages, id, model, websearch, retry_options } = await req.json();
  console.log("retry_options", retry_options);

  if (retry_options.id) {
    for (let i in messages) {
      if (messages[i].id === retry_options.id) {
        if (messages[i].role === "user") {
          messages.splice(i + 1);
        } else {
          messages.splice(i);
        }
        break;
      }
    }
    console.log("retry_options", messages);
  }
  //return null;
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

  const modelDefinition = getModelProperties(model);
  const modelInstance = getModelInstance(model, { apiKey });
  if (!modelInstance) throw new Error("model not found");

  // trigger the response now but await it later
  const saveChatPromise = saveChat({
    id,
    token,
    messages,
  });
  after(async () => saveChatPromise);
  console.log("messages", messages);
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
  if (modelDefinition.image_generation) {
    const result = await generateText({
      model: modelInstance,
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
        openai: { responseModalities: ["TEXT", "IMAGE"] },
      },
      messages: messages,
    });
    return new Response(JSON.stringify(result.response), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const tools: ToolSet = {
    getWebsiteContent: {
      description: "search the web",
      parameters: z.object({ url: z.string() }),
      execute: async (args: { url: string }) => {
        const response = await fetch(args.url);
        const text = await response.text();
        return text;
      },
    },
    getDate: {
      description: "get the today's date",
      parameters: z.object({}),
      execute: async () => {
        return new Date().toISOString();
      },
    },
  };
  /* // it seems this isn't working
  if (websearch && modelDefinition.websearch) {
    console.log("websearch");
    tools["web_search_preview"] = openai.tools.webSearchPreview({
      // optional configuration:
      searchContextSize: "high",
      userLocation: {
        type: "approximate",
        city: "San Francisco",
        region: "California",
      },
    });
  }*/

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
        model: response.modelId,
      });
    },
    tools: tools,
    maxSteps: 5,
    providerOptions: {
      google: { responseModalities: ["TEXT", "IMAGE"] },
      //openai: { responseModalities: ["TEXT", "IMAGE"] },
      //anthropic: { responseModalities: ["TEXT", "IMAGE"] },
      //deepseek: { responseModalities: ["TEXT", "IMAGE"] },
    },
  });

  return result.toDataStreamResponse();
}

import { Message } from "ai";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { getAuthToken } from "@/app/auth";
import { getModelInstance, getModelProvider } from "@/lib/model-instance";
import { after } from "next/server";
import { z } from "zod";
import { getModelProperties } from "@/lib/model-definitions";
import { google } from "@ai-sdk/google";

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
  model,
}: {
  id: string; // chats;
  messages: Message[];
  token: string;
  model?: string;
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
