import { fetchMutation } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/app/auth";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const token = await getAuthToken();
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
        <div className="text-center space-y-8 max-w-2xl">
          <h1 className="text-5xl font-bold text-pink-600 mb-6">R6 Chat</h1>
          <p className="text-xl text-gray-600 mb-8">
            A modern chat interface with AI capabilities. Sign in to start chatting!
          </p>
          <div className="flex justify-center">
            <SignInButton mode="modal">
              <Button className="bg-pink-600 hover:bg-pink-700 text-white text-lg px-8 py-6 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105">
                Get Started
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }
  const id = await fetchMutation(
    api.chats.addChat,
    {},
    {
      token: await getAuthToken(),
    },
  ); // create a new chat
  redirect(`/chat/${id}`); // redirect to chat page, see below
}
