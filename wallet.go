package main

import (
	"strconv"
	"strings"
)

// Wallet is what the UI displays. Raw is kept alongside so the window can
// show exactly what the LCU returned — useful for verifying this against a
// real client, since the endpoint/field names below aren't documented.
type Wallet struct {
	RP          float64     `json:"rp"`
	BlueEssence float64     `json:"blueEssence"`
	Raw         interface{} `json:"raw"`
	Source      string      `json:"source"`
}

// candidateWalletPaths are tried in order. The LCU has moved and renamed
// this endpoint across patches; community tools commonly fall back through
// several variants rather than hardcoding one. Unverified against a live
// client — see README.
var candidateWalletPaths = []string{
	`/lol-inventory/v1/wallet?currencyTypes=["lol_blue_essence","RP"]`,
	"/lol-inventory/v1/wallet",
	"/lol-store/v1/wallet",
}

func fetchWallet(c *lcuClient) (Wallet, error) {
	var lastErr error
	for _, path := range candidateWalletPaths {
		v, err := c.get(path)
		if err != nil {
			lastErr = err
			continue
		}
		if v == nil {
			continue
		}
		w := parseWallet(v)
		w.Raw = v
		w.Source = path
		return w, nil
	}
	if lastErr == nil {
		lastErr = errNoWalletData
	}
	return Wallet{}, lastErr
}

var errNoWalletData = &walletError{"no candidate endpoint returned data"}

type walletError struct{ msg string }

func (e *walletError) Error() string { return e.msg }

func parseWallet(v interface{}) Wallet {
	m, ok := v.(map[string]interface{})
	if !ok {
		return Wallet{}
	}
	find := func(keys ...string) (float64, bool) {
		for mk, mv := range m {
			for _, k := range keys {
				if !strings.EqualFold(mk, k) {
					continue
				}
				switch n := mv.(type) {
				case float64:
					return n, true
				case string:
					if f, err := strconv.ParseFloat(n, 64); err == nil {
						return f, true
					}
				}
			}
		}
		return 0, false
	}
	rp, _ := find("rp", "riotPoints", "riot_points", "lol_rp")
	be, _ := find("lol_blue_essence", "blueEssence", "blue_essence", "ip")
	return Wallet{RP: rp, BlueEssence: be}
}
