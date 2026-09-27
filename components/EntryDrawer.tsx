"use client";

import { ReactNode, useEffect } from "react";

type EntryDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function EntryDrawer({ open, onClose, title, children }: EntryDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-30 flex h-dvh max-h-dvh flex-col bg-[#f7f8fa] pt-[env(safe-area-inset-top)]"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#e6e8ec] px-4 py-3 sm:px-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full bg-white px-4 text-sm font-medium"
        >
          닫기
        </button>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
    </div>
  );
}
