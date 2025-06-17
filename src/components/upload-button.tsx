// components/upload-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export function UploadButton({
  chatId,
  onUpload,
}: {
  chatId: Id<"chats">;
  onUpload: (image: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  //const sendImage = useMutation(api.messages.sendImage);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      // Use the file type to create the correct data URL prefix
      const dataUrlPrefix = `data:${file.type};base64,`;
      onUpload(`${dataUrlPrefix}${base64.split(",")[1]}`); // Only append the base64 part

      const { storageId } = await result.json();
      console.log(storageId);
      // Step 3: Save the newly allocated storage id to the database
      /*await sendImage({
        chatId,
        storageId,
        type: file.type,
      });*/
    } catch (error) {
      console.error("Upload failed:", error);
      // Handle error appropriately
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="sr-only">Upload image</span>
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
