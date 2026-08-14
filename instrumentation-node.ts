import { validateRuntimeEnvironment } from "@/config/env";
import { log } from "@/services/logger";

export function registerNodeInstrumentation() { validateRuntimeEnvironment(); log("info", "application.started", { nodeVersion: process.version }); }
