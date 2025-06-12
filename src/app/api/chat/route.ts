// Allow streaming responses up to 30 seconds
import { fetchMutation } from "convex/nextjs";

export const maxDuration = 30;

import { openai } from "@ai-sdk/openai";
import { appendResponseMessages, streamText } from "ai";
//import { saveChat } from "@tools/chat-store";

export async function POST(req: Request) {
  const { messages, id } = await req.json();

  const token = await getAuthToken();

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
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
import { writeFile } from "fs/promises";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { getAuthToken } from "@/app/auth";

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
  const content = JSON.stringify(messages, null, 2);
  await writeFile(`${id}.json`, content);
}
