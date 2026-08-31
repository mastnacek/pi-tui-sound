import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout } from "node:timers";

let audioWorker: ChildProcess | null = null;
let isEnabled = true;

export function initAudioWorker(): void {
  if (audioWorker && !audioWorker.killed) return;
  try {
    audioWorker = spawn("powershell", ["-NoProfile", "-Command", "-"], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    audioWorker.on("error", () => {
      audioWorker = null;
    });
  } catch {
    audioWorker = null;
  }
}

export function playTone(freq: number, durationMs: number): void {
  if (!isEnabled) return;
  initAudioWorker();
  if (audioWorker?.stdin?.writable) {
    try {
      audioWorker.stdin.write(`[Console]::Beep(${freq}, ${durationMs})\n`);
    } catch {
      // Non-fatal
    }
  }
}

export function playEnter(): void {
  playTone(520, 60);
}

export function playExclamation(): void {
  playTone(1200, 45);
}

export function playQuestion(): void {
  playTone(880, 40);
  setTimeout(() => playTone(1100, 40), 50);
}

export function playPunctuation(): void {
  playTone(400, 30);
}

export function getSoundStatus(): boolean {
  return isEnabled;
}

export function setSoundStatus(enabled: boolean): void {
  isEnabled = enabled;
}

export function cleanupAudioWorker(): void {
  if (audioWorker) {
    try {
      audioWorker.kill();
    } catch {
      // Ignore
    }
    audioWorker = null;
  }
}

export default function (pi: ExtensionAPI): void {
  pi.on("session_start", (_event: unknown, ctx: ExtensionContext) => {
    initAudioWorker();

    if (ctx.hasUI) {
      ctx.ui.onTerminalInput((data: string) => {
        if (!isEnabled) return undefined;

        if (data === "\r" || data === "\n") {
          playEnter();
        } else if (data === "!") {
          playExclamation();
        } else if (data === "?") {
          playQuestion();
        } else if (
          data === "." ||
          data === "," ||
          data === ";" ||
          data === ":"
        ) {
          playPunctuation();
        }

        return undefined;
      });
    }
  });

  pi.on("session_shutdown", () => {
    cleanupAudioWorker();
  });

  const SOUND_DOCS: Record<string, string> = {
    on: "Zapnout zvukové efekty",
    off: "Vypnout zvukové efekty",
    test: "Otestovat zvuky kláves",
    status: "Zobrazit stav zvuku",
    help: "Zobrazit nápovědu",
  };

  pi.registerCommand("sound", {
    description: "Nastavení zvukových efektů TUI",
    getArgumentCompletions: (prefix: string) => {
      const tokens = prefix.split(/\s+/).filter(Boolean);
      const trailingSpace = /\s$/.test(prefix);
      if (tokens.length > 1 || (trailingSpace && tokens.length === 1)) {
        return null;
      }
      const typed = (tokens[0] ?? "").toLowerCase();
      const items = Object.entries(SOUND_DOCS)
        .filter(([key]) => key.toLowerCase().startsWith(typed))
        .map(([value, description]) => ({ value, label: value, description }));
      return items.length > 0 ? items : null;
    },
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const tokens = args.trim().split(/\s+/).filter(Boolean);
      const sub = (tokens[0] ?? "").toLowerCase();

      if (!sub || sub === "help" || sub === "-h" || sub === "--help") {
        ctx.ui.notify(
          [
            "🔊 pi-tui-sound — Správa zvuků TUI",
            "",
            "Příkazy:",
            "  /sound on     — Zapnout zvuky",
            "  /sound off    — Vypnout zvuky",
            "  /sound test   — Přehrát testovací sadu",
            "  /sound status — Zobrazit aktuální stav",
            "  /sound help   — Zobrazit tuto nápovědu",
          ].join("\n"),
          "info",
        );
        return;
      }

      if (sub === "on") {
        isEnabled = true;
        ctx.ui.notify("Zvukové efekty zapnuty 🔊", "info");
        playEnter();
        return;
      }

      if (sub === "off") {
        isEnabled = false;
        ctx.ui.notify("Zvukové efekty vypnuty 🔇", "info");
        return;
      }

      if (sub === "test") {
        ctx.ui.notify("Testuji zvuky (Enter, !, ?, .)...", "info");
        playEnter();
        setTimeout(() => playExclamation(), 250);
        setTimeout(() => playQuestion(), 500);
        setTimeout(() => playPunctuation(), 800);
        return;
      }

      if (sub === "status") {
        ctx.ui.notify(
          `Stav zvuku: ${isEnabled ? "Zapnuto 🔊" : "Vypnuto 🔇"}`,
          "info",
        );
        return;
      }

      ctx.ui.notify(
        `Neznámý příkaz "${sub}". Použijte: /sound help`,
        "warning",
      );
    },
  });
}
