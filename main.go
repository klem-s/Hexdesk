// Hexdesk - a small desktop window, run alongside the official League
// client, showing your wallet (RP / Blue Essence). First milestone of a
// standalone desktop companion — separate project from LoL Remote, no
// phone/HTTP component: the window talks to Go directly via Bind, not an
// API.
package main

import (
	_ "embed"
	"encoding/json"
	"os"

	webview "github.com/jchv/go-webview2"
)

//go:embed ui.html
var uiHTML string

func main() {
	client := newLCUClient()

	w := webview.NewWithOptions(webview.WebViewOptions{
		WindowOptions: webview.WindowOptions{
			Title: "Hexdesk", Width: 420, Height: 340, Center: true,
		},
	})
	if w == nil {
		// No console on a GUI-subsystem build; nothing to report to but exit.
		os.Exit(1)
	}
	defer w.Destroy()
	w.SetSize(420, 340, webview.HintFixed)

	_ = w.Bind("getWallet", func() string {
		wallet, err := fetchWallet(client)
		if err != nil {
			b, _ := json.Marshal(map[string]string{"error": err.Error()})
			return string(b)
		}
		b, _ := json.Marshal(wallet)
		return string(b)
	})

	w.SetHtml(uiHTML)
	w.Run()
}
