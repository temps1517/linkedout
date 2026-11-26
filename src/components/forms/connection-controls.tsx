"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendConnectionAction, startThreadAction } from "@/actions/network";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyFormState } from "@/types";
import type { ConnectionStatus } from "@/types";

export function ConnectButton({
  userId,
  status,
}: {
  userId: string;
  status: ConnectionStatus;
}) {
  const [state, formAction, pending] = useActionState(sendConnectionAction, emptyFormState);

  if (status === "ACCEPTED") {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          Connected
        </span>
        <Link href={`/messages?user=${userId}`}>
          <Button variant="outline">Message</Button>
        </Link>
      </div>
    );
  }

  if (status === "PENDING_SENT") {
    return (
      <span className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
        Request sent
      </span>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="addresseeId" value={userId} />
      <Input name="message" placeholder="Add a short note (optional)" className="max-w-sm" />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : status === "PENDING_RECEIVED" ? "Accept request" : "Connect"}
      </Button>
      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function StartThreadForm({ otherUserId }: { otherUserId: string }) {
  const [state, formAction, pending] = useActionState(startThreadAction, emptyFormState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="otherUserId" value={otherUserId} />
      <textarea
        name="body"
        required
        rows={4}
        placeholder="Write your message…"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
