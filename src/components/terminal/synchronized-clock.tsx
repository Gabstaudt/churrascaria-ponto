"use client";

import { useEffect, useState } from "react";
import { TerminalClock } from "./terminal-clock";

export function SynchronizedClock() { const [offsetMs, setOffsetMs] = useState(0); useEffect(() => { let active = true; const started = Date.now(); fetch("/api/time", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((data: { epochMs: number }) => { if (!active) return; const midpoint = started + (Date.now() - started) / 2; setOffsetMs(data.epochMs - midpoint); }).catch(() => undefined); return () => { active = false; }; }, []); return <TerminalClock offsetMs={offsetMs} />; }
