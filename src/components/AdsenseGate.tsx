"use client";

import { useEffect, useState } from "react";
import Adsense from "@/components/Adsense";

export default function AdsenseGate({ slot, className }: { slot: string; className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const user = d?.user;
        if (!user || user?.subscription_status !== "active") setShow(true);
      })
      .catch(() => setShow(true));
  }, []);

  if (!show) return null;
  return <Adsense slot={slot} className={className} />;
}
