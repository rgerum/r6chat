"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { models_definitions } from "@/lib/model-definitions";

// Get unique providers from models_definitions
const MODEL_PROVIDERS = Array.from(
  new Set(models_definitions.map((def) => def.provider))
).map((provider) => {
  const def = models_definitions.find((d) => d.provider === provider)!;
  return {
    id: provider,
    name: def.label,
  };
});

export default function ProfilePage() {
  const { user } = useUser();
  const apiKeys = useQuery(api.userApiKeys.getUserApiKeys);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const upsertKey = useMutation(api.userApiKeys.upsertApiKey);
  const deleteKey = useMutation(api.userApiKeys.deleteApiKey);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !newApiKey.trim()) return;

    try {
      await upsertKey({
        modelProvider: selectedProvider,
        apiKey: newApiKey.trim(),
      });
      setNewApiKey("");
      setSelectedProvider("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to save API key:", error);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      try {
        await deleteKey({ id: id as any });
      } catch (error) {
        console.error("Failed to delete API key:", error);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="gap-2 pl-0">
          <Link href="/chat">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and API keys
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={user?.fullName || ""}
                disabled
                className="mt-1 max-w-md"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={user?.emailAddresses[0]?.emailAddress || ""}
                disabled
                className="mt-1 max-w-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Add or update your API keys for different model providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isAdding ? (
              <Button
                variant="outline"
                onClick={() => setIsAdding(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add API Key
              </Button>
            ) : (
              <form
                onSubmit={handleAddKey}
                className="space-y-4 p-4 border rounded-lg bg-muted/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <select
                      id="provider"
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a provider</option>
                      {MODEL_PROVIDERS.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="sk-..."
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewApiKey("");
                      setSelectedProvider("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2 mt-6">
              <h3 className="font-medium">Your API Keys</h3>
              {apiKeys && apiKeys.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {apiKeys.map((key) => (
                    <div
                      key={key._id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <div className="font-medium capitalize">
                          {key.modelProvider}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last updated:{" "}
                          {new Date(key.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteKey(key._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No API keys added yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
