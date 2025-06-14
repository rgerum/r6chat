import ChatDashboard from "@/components/chat-dashboard";

export default async function Page(props: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await props.params;
  return <ChatDashboard chatId={chatId} />;
}
