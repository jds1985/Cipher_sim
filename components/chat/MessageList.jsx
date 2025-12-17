"use client";

import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  onTouchStart,
  onTouchEnd,
}) {
  return (
    <div
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
    </div>
  );
}
