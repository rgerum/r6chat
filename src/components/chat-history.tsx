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
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, LucideIcon, SquareIcon } from "lucide-react";
import { IconType } from "@icons-pack/react-simple-icons";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ChatHistoryWrapper(props: { chatId: Id<"chats"> | undefined }) {
  const chatHistory = useQuery(api.chats.getChat, {
    chatId: props.chatId,
  });
  return (
    <ChatText
      chatId={props.chatId as Id<"chats">}
      initialMessages={
        chatHistory
          ? chatHistory?.messages.map((m) => JSON.parse(m) as Message)
          : []
      }
    />
  );
}

function ChatText(props: { chatId: Id<"chats">; initialMessages?: Message[] }) {
  const [model, setModel] = React.useState("gpt-4o-mini");
  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      id: props.chatId,
      initialMessages: props.initialMessages,
      sendExtraMessageFields: true,
      body: { model },
    });

  const addChat = useMutation(api.chats.addChat);
  const router = useRouter();
  React.useEffect(() => {
    document.getElementById("chat-input")?.focus();
    // go to the bottom when the chat changed
    window.scrollTo({ top: document.body.scrollHeight });

    if (props.chatId) return;
    async function triggerAddChat() {
      const id = await addChat({});
      router.push(`/chat/${id}`);
    }
    void triggerAddChat();
  }, [props.chatId]);

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
    status,
  ]);

  function handleStop(e: { preventDefault: () => void }) {
    e.preventDefault();
    stop();
  }

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
      {status === "submitted" && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-600" />
        </div>
      )}
      <div className={"h-10"} />

      <form
        onSubmit={
          status === "submitted" || status === "streaming"
            ? handleStop
            : handleSubmit
        }
        className="box-content p-4 pb-2 -ml-3 fixed bottom-0 w-full max-w-lg border-10 border-b-0 border-pink-100 rounded-t-md bg-pink-50"
      >
        <div className="flex flex-grow flex-row items-start mb-2">
          <AutoResizeTextarea
            name="input"
            id="chat-input"
            placeholder="Type your message here..."
            className="w-full max-h-[200px] resize-none bg-transparent text-base leading-6 text-foreground outline-none placeholder:text-secondary-foreground/60 disabled:opacity-0 overflow-y-auto"
            aria-label="Message input"
            aria-describedby="chat-input-description"
            autoComplete="off"
            value={input}
            onChange={handleInputChange}
          />
          <div id="chat-input-description" className="sr-only">
            Press Enter to send, Shift + Enter for new line
          </div>
        </div>
        <div className="flex gap-2">
          <SelectModel model={model} setModel={setModel} />
          <Button type="submit" className={"ml-auto"}>
            {status === "ready" || status === "error" ? (
              <ArrowUpIcon />
            ) : (
              <SquareIcon />
            )}
          </Button>
        </div>
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
      <SelectTrigger className="-ml-4 w-fit border-0 shadow-none hover:bg-pink-300">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models_definitions.map((definition) => (
          <SelectGroup key={definition.label}>
            <SelectLabel>{definition.label}</SelectLabel>
            {definition.options.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <Icon icon={definition.icon} className="mr-0.5" /> {model.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function Icon(props: {
  icon: IconType | undefined;
  className?: string;
  size?: number;
}) {
  if (!props.icon) return null;
  return <props.icon className={props.className} size={props.size} />;
}

function AutoResizeTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set the height to scrollHeight with a max of 200px
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [props.value]);

  return (
    <textarea
      ref={textareaRef}
      {...props}
      rows={2}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          // @ts-ignore - handleSubmit is from the parent form
          const form = e.currentTarget.form;
          if (form) {
            const submitEvent = new Event("submit", {
              cancelable: true,
              bubbles: true,
            });
            form.dispatchEvent(submitEvent);
          }
        }
      }}
    />
  );
}
