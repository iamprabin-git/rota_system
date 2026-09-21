"use client";

import { useEffect, useState } from "react";
import { companyHue, initials } from "@/lib/profile";

export function CompanyMark({
  name,
  logo,
  companyId,
  size = "md",
}: {
  name: string;
  logo?: string;
  companyId?: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [logo]);
  const show = Boolean(logo) && !failed;
  const hue = companyHue(companyId || name);
  return (
    <span
      className={`company-mark${size === "sm" ? " compact" : ""}`}
      style={show ? undefined : { background: `hsl(${hue} 38% 42%)`, color: "#fff8ee" }}
      aria-hidden
    >
      {show ? (
        <img
          src={`/api/company/logo?companyId=${encodeURIComponent(companyId || "")}&v=${encodeURIComponent(logo || "")}`}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
