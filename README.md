# 🔊 pi-tui-sound

**Interactive real-time sound effects and audio feedback for the [Pi coding agent](https://github.com/earendil-works/pi) TUI.**

Poskytuje zvukovou odezvu při psaní v editoru agenta Pi (klávesa Enter, vykřičník, otazník, interpunkce a další akce).

---

## ✨ Funkce

- 🔊 **Zvukové efekty pro klávesy:**
  - `Enter` (`\r`): Potvrzovací tón (520 Hz).
  - `!` (Vykřičník): Výrazný vysoký ping (1200 Hz).
  - `?` (Otazník): Vzestupný melodický tón (880 Hz ➔ 1100 Hz).
  - `.`, `,`, `;` (Interpunkce): Jemné mechanické kliknutí (400 Hz).
- ⚡ **Zero-latency background engine:** Spolehlivé přehrávání bez blokování TUI vlákna.
- 🎛️ **Příkaz `/sound`:** Zapnutí/vypnutí a nastavení zvukových profilů.

---

## 📦 Instalace

Přidejte repozitář do svých Pi packages v `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "git:github.com/mastnacek/pi-tui-sound"
  ]
}
```

Nebo nainstalujte přímo přes Pi:

```bash
pi package add git:github.com/mastnacek/pi-tui-sound
```

---

## 🛠️ Příkazy

- `/sound on` — Zapnout zvukové efekty.
- `/sound off` — Vypnout zvukové efekty.
- `/sound status` — Zobrazit stav zvukového modulu.
- `/sound test` — Přehrát testovací sadu zvuků.
- `/sound help` — Zobrazit nápovědu.

---

## 📄 Licence

MIT © [mastnacek](https://github.com/mastnacek)
