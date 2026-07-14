"use client";

import MessagesInbox from "@/components/MessagesInbox";

/**
 * Mobile wrapper for MessagesInbox.
 * Renders the inbox in a full-height container. On small screens,
 * MessagesInbox's grid layout stacks conversation list and chat area
 * vertically by default (grid defaults to single column below lg).
 */
export function MessagesMobileView() {
  return (
    <div className="h-full">
      <MessagesInbox role="HR" />
    </div>
  );
}
