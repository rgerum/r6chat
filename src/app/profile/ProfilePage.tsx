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
import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Trash2, Plus, ArrowLeft, LogOut, UserX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut(() => router.push('/'));
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      await signOut();
      router.push('/');
      toast.success('Your account has been deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
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
            
            <div className="pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="gap-2"
                >
                  <UserX className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for different model providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {MODEL_PROVIDERS.map((provider) => {
              const existingKey = apiKeys?.find(k => k.modelProvider === provider.id);
              const [isEditing, setIsEditing] = useState(false);
              const [apiKey, setApiKey] = useState(existingKey?.apiKey || '');

              const handleSave = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!apiKey.trim()) return;

                try {
                  await upsertKey({
                    modelProvider: provider.id,
                    apiKey: apiKey.trim(),
                  });
                  setIsEditing(false);
                } catch (error) {
                  console.error('Failed to save API key:', error);
                }
              };

              return (
                <div key={provider.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">{provider.name}</h3>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        {existingKey ? 'Edit' : 'Add Key'}
                      </Button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={`Enter your ${provider.name} API key`}
                          className="flex-1"
                        />
                        <Button type="submit">Save</Button>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => {
                            setApiKey(existingKey?.apiKey || '');
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">
                        {existingKey ? (
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">••••••••••••••••</span>
                            <span className="text-xs text-muted-foreground">
                              Updated {new Date(existingKey.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span>No API key added</span>
                        )}
                      </div>
                      {existingKey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteKey(existingKey._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
