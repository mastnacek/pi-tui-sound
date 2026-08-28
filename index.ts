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
        } else if (data === "." || data === "," || data === ";" || data === ":") {
          playPunctuation();
        }

        return undefined;
      });
    }
  });

  pi.on("session_shutdown", () => {
    cleanupAudioWorker();
  });

  pi.registerCommand("sound", {
    description: "Nastavení zvukových efektů TUI",
    getArgumentCompletions: (prefix: string) => {
      const options = [
        { value: "sound on", label: "on", description: "Zapnout zvukové efekty" },
        { value: "sound off", label: "off", description: "Vypnout zvukové efekty" },
        { value: "sound test", label: "test", description: "Otestovat zvuky kláves" },
        { value: "sound status", label: "status", description: "Zobrazit stav zvuku" },
        { value: "sound help", label: "help", description: "Zobrazit nápovědu" },
      ];
      const filtered = options.filter((o) =>
        o.value.toLowerCase().startsWith(prefix.trim().toLowerCase()),
      );
      return filtered.length > 0 ? filtered : null;
    },
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const sub = args.trim().toLowerCase();

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
        [
          "🔊 pi-tui-sound — Správa zvuků TUI",
          "",
          "Příkazy:",
          "  /sound on     — Zapnout zvuky",
          "  /sound off    — Vypnout zvuky",
          "  /sound test   — Přehrát testovací sadu",
          "  /sound status — Zobrazit aktuální stav",
        ].join("\n"),
        "info",
      );
    },
  });
}
