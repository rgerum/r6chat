import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, Share2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export function ShareButton({
  chatId,
  access_public,
}: {
  chatId: Id<"chats">;
  access_public: boolean;
}) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const accessLevel = access_public ? "public" : "private";
  const [isCopied, setIsCopied] = useState(false);

  const updateChatReadable = useMutation(
    api.chats.updateChatReadable,
  ).withOptimisticUpdate(
    (localStore, { chatId, access_public: newAccessPublic }) => {
      // Get the current value from the local store
      const current = localStore.getQuery(api.chats.getChat, { chatId });
      if (current) {
        // Update the local copy with the new value
        localStore.setQuery(
          api.chats.getChat,
          { chatId },
          { ...current, access_public: newAccessPublic },
        );
      }
    },
  );

  const shareLink = `${window.location.origin}/chat/${chatId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  const handleAccessLevelChange = async (value: "private" | "public") => {
    try {
      await updateChatReadable({
        chatId,
        access_public: value === "public",
      });
    } catch (error) {
      console.error("Failed to update chat access level:", error);
    }
  };

  return (
    <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="access-level" className="text-right">
              Access
            </Label>
            <Select value={accessLevel} onValueChange={handleAccessLevelChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Anyone with the link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">
              Link
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input id="link" value={shareLink} readOnly className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {isCopied ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
