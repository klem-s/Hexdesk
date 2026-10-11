# Hexdesk

A small desktop window, run alongside the official League of Legends client, mirroring lobby and wallet information the client itself already has.

Separate project from [LoL Remote](https://github.com/klem-s/LeagueRemote): no phone, no PWA, no HTTP server or PIN. Hexdesk talks to the League client's local API directly from a native window on the same PC, and the window talks to Go directly through WebView2 bindings rather than a JSON API — there's nothing else on the machine that needs to reach it.

## Status

Early: lobby (queue selection, party, role preferences, find match / ready check) and a wallet display. No champ select yet, no shop.

## Installation

Download `hexdesk.exe` from Releases and run it. A window opens with two tabs:

- **Lobby** — pick a queue (Ranked Solo/Duo, Flex, Quickplay, ARAM, Arena), see your party, set your own role preferences, and find a match / respond to the ready check — all mirroring what the official client's lobby screen shows.
- **Wallet** — current RP and Blue Essence.

Both tabs have a collapsible "Raw" section showing exactly what the League client returned, for verifying/debugging against a real session.

**Not included:** party chat. Connecting to League's chat system is explicitly one of the things Riot's Developer Policy asks third-party tools not to do ("utilize methods to connect to other League of Legends systems, such as League chat, that haven't been included in the third party tools"), so this stays in the official client — the Lobby tab shows a note about this instead of a chat box.

## How it works

Like LoL Remote, this reads the port and auth token for the League client's local **LCU API** off the running `LeagueClientUx.exe` process (via PowerShell), so it works regardless of where League is installed. See `lcu.go`.

The UI itself lives in `web/` — a React + TypeScript app, built to a single self-contained `web/dist/index.html` (via `vite-plugin-singlefile`, no separate JS/CSS files) and embedded into the Go binary with `go:embed`. It talks to Go purely through WebView2's `Bind()` (see `main.go`) — every `window.<fn>()` call it makes resolves to a JSON string the Go side marshaled, no HTTP involved. `web/src/devMock.ts` stands in for those bindings during `npm run dev` so the UI is previewable without a running League client; it's excluded from the production build.

## Things to watch for

- **The wallet endpoint is unverified against a live client.** Riot has moved and renamed this endpoint across patches, and I found no current public documentation for it. `wallet.go` tries, in order:
  - `/lol-inventory/v1/wallet?currencyTypes=["lol_blue_essence","RP"]`
  - `/lol-inventory/v1/wallet`
  - `/lol-store/v1/wallet`

  and parses the first one that returns data, matching RP/Blue Essence under several possible key spellings (`rp`/`riotPoints`/`riot_points`/`lol_rp`, `lol_blue_essence`/`blueEssence`/`blue_essence`/`ip`). If this shows `0` or an error on a real client, the "Raw response" panel is the fastest way to see what actually came back and fix the parsing.
- **The lobby/role-preference endpoints are more established but still unverified here.** `/lol-lobby/v2/lobby`, `/lol-lobby/v2/lobby/matchmaking/search`, and `/lol-matchmaking/v1/ready-check` are long-standing and widely used by other community tools, so confidence is higher than the wallet endpoint — but `firstPositionPreference`/`secondPositionPreference` field names on lobby members, and the exact `position-preferences` PUT body shape, haven't been exercised against a live client yet. The "Raw lobby data" panel is there for exactly this.
- Queue IDs (420/440/490/450/1700) come from Riot's own published [`queues.json`](https://static.developer.riotgames.com/docs/lol/queues.json) — not a guess, unlike most of what this project touches.
- The LCU isn't an official API: endpoints can change after a patch, same caveat as LoL Remote.
- This project (and LoL Remote) is registered with Riot per their Developer Policies; the use of undocumented endpoints like the wallet one above is exactly the kind of thing flagged for their review.
- The ready-check overlay shows a real countdown (`timer` field) and your own accept/decline response (`playerResponse`), but **not** teammates' live accept status — that endpoint doesn't expose other players' responses to a non-leader client, so this app doesn't fake it either.

## Building from source

The UI has to be built before the Go binary, since it's embedded via `go:embed`:

```
cd web && npm ci && npm run build && cd ..
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w -H=windowsgui" -o hexdesk.exe .
```

One Go dependency, no cgo: [`jchv/go-webview2`](https://github.com/jchv/go-webview2) (pure-Go binding to Windows' WebView2 control — same one LoL Remote's popup uses).

## Publishing a release

Every `vX.Y.Z` tag pushed to GitHub triggers CI (`.github/workflows/release.yml`), which builds `hexdesk.exe` for Windows and publishes a Release with the binary attached.

```
git tag v0.1.0
git push origin v0.1.0
```

---

Hexdesk isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
