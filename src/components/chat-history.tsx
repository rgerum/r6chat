import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
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
import {
  AlertCircle,
  ArrowUpIcon,
  CheckIcon,
  CopyIcon,
  FileText,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { Copy, GitBranch, RefreshCw } from "lucide-react";
import { IconType } from "@icons-pack/react-simple-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { EmptyState } from "@/components/empty-state";
import { UploadButton } from "@/components/upload-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatHistoryWrapper(props: {
  chatId: Id<"chats"> | undefined;
  isNewChat: boolean;
}) {
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
      newChat={
        (chatHistory && chatHistory.messages.length === 0) ||
        !props.chatId ||
        props.isNewChat
      }
      writeable={chatHistory?.writeable ?? true}
      access_public={chatHistory?.access_public ?? false}
    />
  );
}

function ChatSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-600" />
    </div>
  );
}

function ChatText(props: {
  chatId: Id<"chats">;
  initialMessages?: Message[];
  writeable: boolean;
  access_public: boolean;
  newChat: boolean;
}) {
  const [model, setModel] = React.useState("gpt-4o-mini");
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    append,
  } = useChat({
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
      router.push(`/chat/${id}?new`);
    }
    void triggerAddChat();
  }, [props.chatId]);

  // Add this state to track scroll position
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [attachFile, setAttachFile] = React.useState<FileList | null>(null);

  // Update the scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const isBottom = scrollHeight - (scrollTop + clientHeight) <= 1; // 100px threshold
      setIsAtBottom(isBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
    });
  }, [props.chatId]);

  React.useEffect(() => {
    if (!isAtBottom) return;
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
  function handleSubmitWrapper(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (attachFile) {
      append(
        {
          role: "user",
          content: input,
        },
        {
          experimental_attachments: attachFile,
        },
      );
      setInput("");
      setAttachFile(null);
    } else handleSubmit(e);
  }
  console.log(messages);

  return (
    <div className="flex flex-col w-full max-w-lg py-24 px-4 mx-auto stretch">
      {props.writeable ? (
        <div className="flex justify-end mb-4 -mt-20 sticky top-4">
          <ShareButton
            chatId={props.chatId}
            access_public={props.access_public}
          />
        </div>
      ) : (
        <Alert variant="default" className="mb-4 -mt-20 sticky top-3">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>View-only mode</AlertTitle>
          <AlertDescription>The chat has been shared with you</AlertDescription>
        </Alert>
      )}
      {props.newChat && messages.length === 0 && (
        <EmptyState
          hasInput={!!input}
          onSuggestionClick={(suggestion) => {
            // Handle suggestion click
            void append({ role: "user", content: suggestion });
          }}
        />
      )}
      {messages.map((message) => (
        <ChatMessage key={message.id} chatId={props.chatId} message={message} />
      ))}
      {status === "submitted" && <ChatSpinner />}
      <div className={"h-10"} />
      {props.writeable && (
        <form
          onSubmit={
            status === "submitted" || status === "streaming"
              ? handleStop
              : handleSubmitWrapper
          }
          className="p-4 pb-2 -ml-3 fixed bottom-0 w-full max-w-lg border-10 border-b-0 border-pink-100 rounded-t-md bg-pink-50"
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
            <UploadButton
              chatId={props.chatId}
              onUpload={(file: File) => {
                if (file) {
                  const dataTransfer = new DataTransfer();
                  // Add existing files if any
                  if (attachFile) {
                    for (let i = 0; i < attachFile.length; i++) {
                      dataTransfer.items.add(attachFile[i]);
                    }
                  }
                  // Add the new file
                  dataTransfer.items.add(file);
                  setAttachFile(dataTransfer.files);
                }
              }}
            />
            <Button type="submit" className={"ml-auto"}>
              {status === "ready" || status === "error" ? (
                <ArrowUpIcon />
              ) : (
                <SquareIcon />
              )}
            </Button>
          </div>
          {attachFile && attachFile.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="text-xs text-muted-foreground">
                Attached files:
              </div>
              <div className="space-y-0">
                {Array.from(attachFile).map((file, index) => {
                  const isImage = file.type.startsWith("image/");

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/50 rounded py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {isImage ? (
                          <div className="w-6 h-6 flex-shrink-0 rounded overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <FileText className="h-5 w-6 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate max-w-[180px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const dataTransfer = new DataTransfer();
                          Array.from(attachFile).forEach((f, i) => {
                            if (i !== index) dataTransfer.items.add(f);
                          });
                          setAttachFile(
                            dataTransfer.files.length > 0
                              ? dataTransfer.files
                              : null,
                          );
                        }}
                        className="text-muted-foreground hover:text-foreground ml-2"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      )}
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
      <SelectTrigger className="-ml-3 w-fit border-0 shadow-none hover:bg-pink-300">
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

function useBranchMutation() {
  const branchChat = useMutation(api.chats.branchChat);
  const router = useRouter();
  return async (chatId: Id<"chats">, messageId: string) => {
    const newChatId = await branchChat({ chatId, messageId });
    router.push(`/chat/${newChatId}`);
  };
}

function ChatMessage({
  chatId,
  message,
}: {
  chatId: Id<"chats">;
  message: Message;
}) {
  if (
    message.parts &&
    message.parts.length === 1 &&
    message.parts[0].type === "step-start"
  )
    return <ChatSpinner />;
  const branchChat = useBranchMutation();
  return (
    <>
      {message.parts &&
        message.parts.map((part, i) => {
          switch (part.type) {
            case "file":
              return (
                <div
                  key={`${message.id}-${i}`}
                  className="mb-8 flex items-center gap-2"
                >
                  <span className="text-sm text-pink-800">
                    {part.mimeType === "image/jpeg" && (
                      <img
                        src={part.data}
                        alt="Image"
                        width={200}
                        height={200}
                      />
                    )}
                  </span>
                </div>
              );
            case "text":
              return (
                <div
                  key={`${message.id}-${i}`}
                  className={cn(
                    "group mb-8 relative prose",
                    message.role === "user"
                      ? "bg-pink-200 rounded-md p-3 ml-auto max-w-80 w-fit"
                      : "min-h-8", // min height to make the height not jump after the spiner disappear
                  )}
                >
                  <ReactMarkdown
                    components={{
                      pre: ({ node, ref, className, children, ...props }) => {
                        const firstChild = React.Children.toArray(children)[0];

                        if (
                          !firstChild ||
                          typeof firstChild !== "object" ||
                          !("props" in firstChild)
                        ) {
                          return (
                            <pre ref={ref} {...props} className={className}>
                              {children}
                            </pre>
                          );
                        }
                        const className2 = firstChild.props.className as string;
                        const content = String(
                          firstChild.props.children as string,
                        );

                        const match = /language-(\w+)/.exec(className2 || "");
                        return match ? (
                          <div>
                            <div className="flex items-center justify-between bg-pink-200 rounded-t-md pl-3 py-1 pr-1">
                              <div>{match[1]}</div>
                              <CopyButton text={content} />
                            </div>
                            <pre
                              ref={ref}
                              className={"rounded-t-none"}
                              style={{ padding: "0", margin: "0" }}
                            >
                              <SyntaxHighlighter
                                {...props}
                                PreTag="div"
                                children={content.replace(/\n$/, "")}
                                language={match[1]}
                                customStyle={{ margin: 0 }}
                              />
                            </pre>
                          </div>
                        ) : (
                          <pre ref={ref} {...props} className={className}>
                            {children}
                          </pre>
                        );
                      },
                    }}
                  >
                    {part.text}
                  </ReactMarkdown>
                  {message.experimental_attachments && (
                    <div className="flex flex-col gap-2">
                      {message.experimental_attachments.map((a, i) => (
                        <React.Fragment key={i}>
                          {a.contentType?.startsWith("image/") ? (
                            <img
                              src={a.url}
                              style={{ margin: 0, maxHeight: "300px" }}
                            />
                          ) : a.contentType === "application/pdf" ? (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileText className="h-5 w-5 flex-shrink-0" />
                              <span>View PDF</span>
                            </a>
                          ) : (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileText className="h-5 w-5 flex-shrink-0" />
                              <span>View file</span>
                            </a>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  {message.role === "assistant" && (
                    <div className="absolute bottom-3 translate-y-full flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText(part.text || "");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy message</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              void branchChat(chatId, message.id);
                              console.log("Branch from message", message.id);
                            }}
                          >
                            <GitBranch className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Branch from here</TooltipContent>
                      </Tooltip>

                      {message.role === "assistant" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-1 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                // TODO: Implement retry functionality
                                console.log("Retry message", message.id);
                              }}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Regenerate response</TooltipContent>
                        </Tooltip>
                      )}

                      <span className="text-xs text-muted-foreground ml-1">
                        {message.model}
                      </span>
                    </div>
                  )}
                </div>
              );
          }
        })}
    </>
  );
}
