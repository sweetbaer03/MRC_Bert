"use client";

import { useFormStatus } from "react-dom";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string; confirm?: string };

/** form 안에서 제출 중 상태를 표시하고, confirm 문구가 있으면 확인을 받습니다. */
export function SubmitButton({ children, pendingText, confirm, className = "btn-primary", onClick, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending || rest.disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
        onClick?.(e);
      }}
      {...rest}
    >
      {pending ? (pendingText ?? "처리 중...") : children}
    </button>
  );
}
