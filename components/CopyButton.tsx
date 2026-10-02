"use client";

import { useState } from "react";

export function CopyButton({ text, children = "링크 복사" }: { text: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={async () => {
        const url = text.startsWith("/") ? `${window.location.origin}${text}` : text;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "복사됨" : children}
    </button>
  );
}
