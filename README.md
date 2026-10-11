# Hexdesk

A small desktop window, run alongside the official League of Legends client, showing information the client itself already has — starting with your wallet (RP and Blue Essence).

Separate project from [LoL Remote](https://github.com/klem-s/LeagueRemote): no phone, no PWA, no HTTP server or PIN. Hexdesk talks to the League client's local API directly from a native window on the same PC, and the window talks to Go directly through WebView2 bindings rather than a JSON API — there's nothing else on the machine that needs to reach it.

## Status

First milestone: wallet display only. More to come.

## Installation

Download `hexdesk.exe` from Releases and run it. A window opens showing your current RP and Blue Essence, refreshed every 5 seconds, with a collapsible "Raw response" section showing exactly what the League client returned.

## How it works

Like LoL Remote, this reads the port and auth token for the League client's local **LCU API** off the running `LeagueClientUx.exe` process (via PowerShell), so it works regardless of where League is installed. See `lcu.go`.

## Things to watch for

- **The wallet endpoint is unverified against a live client.** Riot has moved and renamed this endpoint across patches, and I found no current public documentation for it. `wallet.go` tries, in order:
  - `/lol-inventory/v1/wallet?currencyTypes=["lol_blue_essence","RP"]`
  - `/lol-inventory/v1/wallet`
  - `/lol-store/v1/wallet`

  and parses the first one that returns data, matching RP/Blue Essence under several possible key spellings (`rp`/`riotPoints`/`riot_points`/`lol_rp`, `lol_blue_essence`/`blueEssence`/`blue_essence`/`ip`). If this shows `0` or an error on a real client, the "Raw response" panel is the fastest way to see what actually came back and fix the parsing — paste it into an issue or back to whoever's debugging this.
- The LCU isn't an official API: endpoints can change after a patch, same caveat as LoL Remote.
- This project (and LoL Remote) is registered with Riot per their Developer Policies; the use of undocumented endpoints like the wallet one above is exactly the kind of thing flagged for their review.

## Building from source

```
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w -H=windowsgui" -o hexdesk.exe .
```

One dependency, no cgo: [`jchv/go-webview2`](https://github.com/jchv/go-webview2) (pure-Go binding to Windows' WebView2 control — same one LoL Remote's popup uses).

## Publishing a release

Every `vX.Y.Z` tag pushed to GitHub triggers CI (`.github/workflows/release.yml`), which builds `hexdesk.exe` for Windows and publishes a Release with the binary attached.

```
git tag v0.1.0
git push origin v0.1.0
```

---

Hexdesk isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
