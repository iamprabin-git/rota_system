"use client";

import { useEffect, useState } from "react";
import { initials } from "@/lib/profile";

export function UserPhoto({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [avatar]);
  const show = Boolean(avatar) && !failed;
  const className = `staff-avatar${size === "sm" ? " compact" : ""}${size === "lg" ? " large" : ""}`;
  return (
    <span className={className}>
      {show ? (
        <img src={`/api/profile/photo?v=${encodeURIComponent(avatar || "")}`} alt="" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
