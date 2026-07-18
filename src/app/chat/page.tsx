import Header from "@/components/layout/Header";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ChatInterface from "@/components/chat/ChatInterface";

export const metadata = {
  title: "Chat — BearTV",
};

function ChatLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" text="Loading chat..." />
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 pb-8">
        <ErrorBoundary>
          <Suspense fallback={<ChatLoading />}>
            <ChatInterface />
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
}
