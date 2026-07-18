"use client";

import { useRef, useEffect } from "react";
import Avatar from "@/components/ui/Avatar";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

interface TextChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  isPartnerTyping: boolean;
  partnerName?: string;
  showTimestamps?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function TextChat({
  messages,
  currentUserId,
  onSend,
  onTyping,
  isPartnerTyping,
  partnerName,
  showTimestamps = false,
  disabled = false,
  className,
}: TextChatProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const behavior =
      typeof document !== "undefined" &&
      document.documentElement.dataset.animations === "none"
        ? "auto"
        : "smooth";
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    const content = inputRef.current?.value.trim();
    if (!content) return;
    onSend(content);
    if (inputRef.current) inputRef.current.value = "";
    onTyping(false);
  };

  const handleInput = () => {
    if (disabled) return;
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-bear-gray/80 backdrop-blur-xl rounded-token border border-white/10 shadow-xl z-20",
        className
      )}
    >
      <div className="px-3 py-2 border-b border-white/5 text-sm font-medium text-white/80">
        Text chat
      </div>
      <div className="flex-1 overflow-y-auto p-[var(--card-padding)] chat-messages flex flex-col min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-sm text-white/30 py-8">
            {disabled
              ? "Connect with someone to start chatting"
              : "Send a message to start chatting"}
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  isOwn
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] rounded-br-sm"
                    : "bg-white/10 text-white/90 rounded-bl-sm"
                }`}
              >
                <p>{msg.content}</p>
                {showTimestamps && (
                  <p className={`text-[10px] mt-1 ${isOwn ? "opacity-70" : "text-white/40"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {isPartnerTyping && !disabled && (
          <div className="flex items-center gap-2 text-xs text-white/40" data-decorative-motion>
            <Avatar name={partnerName} size="sm" />
            <span>typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5">
        <div className="flex gap-2 app-controls">
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            placeholder={disabled ? "Waiting for a partner..." : "Type a message..."}
            onInput={handleInput}
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-sm disabled:opacity-50 transition-token"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
