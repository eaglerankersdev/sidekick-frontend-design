"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

export function HomeLink(props: Omit<ComponentProps<typeof Link>, "href" | "onNavigate">) {
  return (
    <Link
      {...props}
      href="/"
      onNavigate={(event) => {
        if (window.location.pathname !== "/") return;
        event.preventDefault();
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }}
    />
  );
}
