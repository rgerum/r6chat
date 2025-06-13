import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export function ScrollToBottomBox({
  className,
  children,
  count,
}: {
  className?: string;
  children: React.ReactNode;
  count?: number;
}) {
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null); // Ref to the div

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const element = messagesEndRef.current.children[1];
      element.scrollTop = element.scrollHeight;
    }
  };

  // This effect runs every time the 'messages' state changes
  React.useEffect(() => {
    scrollToBottom();
  }, [count]); // Dependency array: re-run when 'messages' changes

  return (
    <ScrollArea
      className={cn("overflow-y-scroll", className)}
      ref={messagesEndRef}
    >
      {children}
    </ScrollArea>
  );
}
