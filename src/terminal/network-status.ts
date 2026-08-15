export type TerminalConnection = "ONLINE" | "OFFLINE";
export function terminalConnection(browserOnline: boolean, heartbeatSucceeded: boolean): TerminalConnection { return browserOnline && heartbeatSucceeded ? "ONLINE" : "OFFLINE"; }
