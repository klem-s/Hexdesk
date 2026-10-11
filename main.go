// Hexdesk - a small desktop window, run alongside the official League
// client, showing lobby and champ-select information. Standalone desktop
// companion — separate project from LoL Remote, no phone/HTTP component:
// the window talks to Go directly via Bind, not an API.
package main

import (
	_ "embed"
	"encoding/json"
	"os"

	webview "github.com/jchv/go-webview2"
)

//go:embed ui.html
var uiHTML string

func bindJSON(w webview.WebView, name string, fn func() (interface{}, error)) {
	_ = w.Bind(name, func() string {
		v, err := fn()
		if err != nil {
			b, _ := json.Marshal(map[string]string{"error": err.Error()})
			return string(b)
		}
		b, _ := json.Marshal(v)
		return string(b)
	})
}

func main() {
	client := newLCUClient()

	w := webview.NewWithOptions(webview.WebViewOptions{
		WindowOptions: webview.WindowOptions{
			Title: "Hexdesk", Width: 480, Height: 680, Center: true,
		},
	})
	if w == nil {
		// No console on a GUI-subsystem build; nothing to report to but exit.
		os.Exit(1)
	}
	defer w.Destroy()
	w.SetSize(480, 680, webview.HintFixed)

	bindJSON(w, "getWallet", func() (interface{}, error) { return fetchWallet(client) })
	bindJSON(w, "getLobby", func() (interface{}, error) { return getLobby(client) })
	bindJSON(w, "getSearchState", func() (interface{}, error) { return getSearchState(client) })
	bindJSON(w, "getReadyCheck", func() (interface{}, error) { return getReadyCheck(client) })

	bindJSON(w, "findMatch", func() (interface{}, error) { return nil, findMatch(client) })
	bindJSON(w, "cancelSearch", func() (interface{}, error) { return nil, cancelSearch(client) })
	bindJSON(w, "acceptReady", func() (interface{}, error) { return nil, acceptReady(client) })
	bindJSON(w, "declineReady", func() (interface{}, error) { return nil, declineReady(client) })

	_ = w.Bind("selectQueue", func(queueID int) string {
		if err := selectQueue(client, queueID); err != nil {
			b, _ := json.Marshal(map[string]string{"error": err.Error()})
			return string(b)
		}
		return `{"ok":true}`
	})
	_ = w.Bind("setRolePreferences", func(first, second string) string {
		if err := setRolePreferences(client, first, second); err != nil {
			b, _ := json.Marshal(map[string]string{"error": err.Error()})
			return string(b)
		}
		return `{"ok":true}`
	})

	w.SetHtml(uiHTML)
	w.Run()
}
