import React from "react";
import ReactMarkdown from "react-markdown";
import { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";
import { Message, useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
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
import { useQuery } from "convex/react";

export function ChatHistoryWrapper(props: { chatId: Id<"chats"> }) {
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
      //behavior: "smooth", // Optional: adds smooth scrolling
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
        <SelectModel model={model} setModel={setModel} />
      </form>
    </div>
  );
}

function SelectModel({
  model,
  setModel,
}: {
  model: string;
  setModel: (model: string) => void;
}) {
  return (
    <Select value={model} onValueChange={setModel}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a model" />
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
