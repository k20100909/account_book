"use client";

import { FormEvent, useEffect, useRef } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  messages: ChatMessage[];
  draft: string;
  isSending: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ChatPanel({
  messages,
  draft,
  isSending,
  onDraftChange,
  onSubmit,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const canSend = draft.trim().length > 0 && !isSending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#c5d4e0]">
      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
        aria-live="polite"
      >
        {messages.map((message) => {
          const mine = message.role === "user";
          return (
            <div key={message.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <span className="mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[11px] font-semibold tracking-tight text-[#3a3a3c]">
                  AI
                </span>
              )}
              <p
                className={`max-w-[78%] whitespace-pre-wrap px-3.5 py-2.5 text-[15px] leading-6 shadow-sm ${
                  mine
                    ? "rounded-2xl rounded-br-md bg-[#fee500] text-[#1d1d1f]"
                    : "rounded-2xl rounded-bl-md bg-white text-[#1d1d1f]"
                }`}
              >
                {message.content}
              </p>
            </div>
          );
        })}
        {isSending && (
          <div className="flex items-end gap-2">
            <span className="mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[11px] font-semibold text-[#3a3a3c]">
              AI
            </span>
            <p className="flex h-10 items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 shadow-sm">
              <span className="chat-dot h-1.5 w-1.5 rounded-full bg-[#8e8e93]" />
              <span className="chat-dot h-1.5 w-1.5 rounded-full bg-[#8e8e93]" />
              <span className="chat-dot h-1.5 w-1.5 rounded-full bg-[#8e8e93]" />
              <span className="sr-only">답변을 작성하고 있어요</span>
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 bg-[#f7f8fa] px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]"
      >
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="오늘 점심 8500원"
          aria-label="메시지"
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-full bg-white px-4 text-base text-[#1d1d1f] outline-none ring-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="h-12 shrink-0 rounded-full bg-[#fee500] px-5 text-sm font-semibold text-[#1d1d1f] disabled:bg-[#e5e5ea] disabled:text-[#8e8e93]"
        >
          전송
        </button>
      </form>
    </section>
  );
}
