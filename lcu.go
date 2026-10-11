package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"regexp"
	"sync"
	"time"
)

var (
	portRe  = regexp.MustCompile(`--app-port=(\d+)`)
	tokenRe = regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)
)

// lcuClient talks to the local League client's unofficial LCU API. Port and
// auth token are discovered from the running LeagueClientUx.exe process, so
// it works regardless of install location, and change every client
// restart — a failed request clears them so the next call re-discovers.
type lcuClient struct {
	mu   sync.Mutex
	port string
	pass string
	http *http.Client
}

func newLCUClient() *lcuClient {
	return &lcuClient{
		http: &http.Client{
			Timeout: 5 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		},
	}
}

func (c *lcuClient) discover() error {
	out, err := exec.Command("powershell", "-NoProfile", "-Command",
		`Get-CimInstance Win32_Process -Filter "name='LeagueClientUx.exe'" | Select-Object -ExpandProperty CommandLine`,
	).Output()
	if err != nil {
		return err
	}
	s := string(out)
	pm := portRe.FindStringSubmatch(s)
	tm := tokenRe.FindStringSubmatch(s)
	if pm == nil || tm == nil {
		return errors.New("League client not found")
	}
	c.mu.Lock()
	c.port, c.pass = pm[1], tm[1]
	c.mu.Unlock()
	return nil
}

func (c *lcuClient) get(path string) (interface{}, error) {
	c.mu.Lock()
	port, pass := c.port, c.pass
	c.mu.Unlock()
	if port == "" {
		if err := c.discover(); err != nil {
			return nil, err
		}
		c.mu.Lock()
		port, pass = c.port, c.pass
		c.mu.Unlock()
	}

	req, err := http.NewRequest("GET", "https://127.0.0.1:"+port+path, bytes.NewReader(nil))
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth("riot", pass)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		c.mu.Lock()
		c.port = ""
		c.mu.Unlock()
		return nil, errors.New("League client unreachable")
	}
	defer resp.Body.Close()
	content, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		c.mu.Lock()
		c.port = ""
		c.mu.Unlock()
		return nil, fmt.Errorf("auth failed (%d)", resp.StatusCode)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(content))
	}
	if len(content) == 0 {
		return nil, nil
	}
	var v interface{}
	if err := json.Unmarshal(content, &v); err != nil {
		return nil, err
	}
	return v, nil
}
