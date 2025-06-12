import ChatDashboard from "@/components/chat-dashboard";

export default async function Page(params: Promise<{ chatId: string }>) {
  const { chatId } = await params;
  return <ChatDashboard chatId={chatId} />;
}
