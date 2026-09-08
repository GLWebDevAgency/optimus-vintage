"use client";

import { useSession } from "@/lib/auth-client";

export function AccountCard() {
  const { data, isPending } = useSession();
  const name = data?.user.name || "—";
  const email = data?.user.email || "";
  return (
    <div className="card flex items-center gap-3">
      <span className="avatar" aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        {isPending ? (
          <>
            <span className="sk text block w-2/5" />
            <span className="sk text block w-3/5 mt-1.5" />
          </>
        ) : (
          <>
            <div className="font-semibold text-[15px] truncate">{name}</div>
            <div className="mono text-[12px] text-ink-3 truncate">{email}</div>
          </>
        )}
      </div>
      <span className="pill stock">Free</span>
    </div>
  );
}
