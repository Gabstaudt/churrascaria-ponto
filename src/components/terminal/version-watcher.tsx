"use client";
import { useEffect, useRef } from "react";
export function VersionWatcher() { const initial = useRef<string>(undefined); useEffect(() => { const check = () => fetch("/api/terminal/version", { cache: "no-store" }).then((response) => response.json()).then(({ version }: { version: string }) => { if (!initial.current) initial.current = version; else if (initial.current !== version) window.location.reload(); }).catch(() => undefined); check(); const timer = window.setInterval(check, 5 * 60_000); return () => window.clearInterval(timer); }, []); return null; }
