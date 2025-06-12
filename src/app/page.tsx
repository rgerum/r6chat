import ChatDashboard from "@/components/chat-dashboard";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/app/auth";

export default async function Page() {
  const id = await fetchMutation(
    api.chats.addChat,
    { title: "New Chat" },
    {
      token: await getAuthToken(),
    },
  ); // create a new chat
  redirect(`/chat/${id}`); // redirect to chat page, see below
  return <ChatDashboard />;
}
