// components/upload-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ImageIcon, Paperclip } from "lucide-react";
import { useRef } from "react";
import { Id } from "@convex/_generated/dataModel";

export function UploadButton({
  onUpload,
}: {
  chatId: Id<"chats">;
  onUpload: (image: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      onUpload(file);
    } catch (error) {
      console.error("Upload failed:", error);
      // Handle error appropriately
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative grid place-content-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          fileInputRef.current?.click();
        }}
      >
        <Paperclip className="h-4 w-4" />
        <span className="sr-only">Upload image</span>
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*,.pdf"
        className="hidden"
      />
    </div>
  );
}
