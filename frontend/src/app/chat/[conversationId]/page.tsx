import { ChatScreen } from "@/components/chat-screen";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatScreen initialConversationId={conversationId} />;
}
