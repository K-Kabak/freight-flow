"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error("[routeError] failed", { digest: error.digest ?? "unavailable" });
    heading.current?.focus();
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold outline-none">
          Something went wrong
        </h1>
        <p className="mt-2 text-slate-500">
          We could not complete this request. Please try again.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
