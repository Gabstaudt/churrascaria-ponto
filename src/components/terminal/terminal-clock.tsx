"use client";

import { useEffect, useState } from "react";

export function TerminalClock({ offsetMs = 0 }: { offsetMs?: number }) { const [now, setNow] = useState(() => new Date(Date.now() + offsetMs)); useEffect(() => { setNow(new Date(Date.now() + offsetMs)); const timer = window.setInterval(() => setNow(new Date(Date.now() + offsetMs)), 1_000); return () => window.clearInterval(timer); }, [offsetMs]); return <div className="point-terminal-clock" aria-label="Horário aproximado do servidor"><time>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now)}</time><span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(now)}</span><small>Horário oficial confirmado no registro</small></div>; }
