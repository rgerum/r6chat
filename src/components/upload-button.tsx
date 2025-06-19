// components/upload-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export function UploadButton({
  chatId,
  onUpload,
}: {
  chatId: Id<"chats">;
  onUpload: (image: { name: string; contentType: string; url: string }) => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createAttachment = useMutation(api.files.createAttachment);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: Upload the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // Step 3: Create the attachment record
      const url = await createAttachment({
        storageId,
        name: file.name,
        type: file.type,
        chatId,
        messageId: Date.now().toString(), // This should be replaced with the actual message ID when the message is created
      });

      // Notify parent component about the upload
      if (!url) return;
      onUpload({ name: file.name, contentType: file.type, url });
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
