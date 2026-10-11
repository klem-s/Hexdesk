package main

import "fmt"

// Queue IDs confirmed against Riot's own published queues.json
// (static.developer.riotgames.com/docs/lol/queues.json) — not a guess.
const (
	QueueSoloDuo   = 420
	QueueFlex      = 440
	QueueQuickplay = 490
	QueueARAM      = 450
	QueueArena     = 1700
)

type Member struct {
	SummonerID int64  `json:"summonerId"`
	Name       string `json:"name"`
	IsLeader   bool   `json:"isLeader"`
	FirstPos   string `json:"firstPosition"`
	SecondPos  string `json:"secondPosition"`
	IsLocal    bool   `json:"isLocal"`
}

type Lobby struct {
	InLobby  bool        `json:"inLobby"`
	QueueID  int         `json:"queueId"`
	IsLeader bool        `json:"isLeader"`
	Members  []Member    `json:"members"`
	Raw      interface{} `json:"raw"`
}

type SearchState struct {
	State        string      `json:"state"` // "Invalid" | "Searching" | "Found" | "Error"
	TimeInQueue  float64     `json:"timeInQueue"`
	EstimatedSec float64     `json:"estimatedSec"`
	Raw          interface{} `json:"raw"`
}

type ReadyCheck struct {
	State          string  `json:"state"`          // "Invalid" | "InProgress" | "Accepted" | "Declined"
	PlayerResponse string  `json:"playerResponse"` // the local player's own response: "None" | "Accepted" | "Declined"
	Timer          float64 `json:"timer"`          // seconds left to respond
}

// memberName prefers the modern Riot ID (gameName#tagLine) over the legacy
// summonerName field, in case either is ever embedded directly on a lobby
// member object. In practice neither is: current LCU lobby members carry
// only a puuid, with summonerName left as "" — see currentSummonerName and
// resolveSummonerName below, which is where real names actually come from.
func memberName(mm map[string]interface{}) string {
	name := asString(mm["gameName"])
	if name == "" {
		return asString(mm["summonerName"])
	}
	if tag := asString(mm["tagLine"]); tag != "" {
		return name + "#" + tag
	}
	return name
}

// currentSummonerName returns the local player's Riot ID via
// /lol-summoner/v1/current-summoner — a long-standing, widely-relied-on
// endpoint (used by essentially every third-party League tool), far more
// reliable here than any field on the lobby's own localMember object.
func currentSummonerName(c *lcuClient) string {
	v, err := c.get("/lol-summoner/v1/current-summoner")
	if err != nil || v == nil {
		return ""
	}
	m := asMap(v)
	name := asString(m["gameName"])
	if name == "" {
		return asString(m["displayName"])
	}
	if tag := asString(m["tagLine"]); tag != "" {
		return name + "#" + tag
	}
	return name
}

// resolveSummonerName looks up another party member's Riot ID by puuid,
// since lobby member objects expose only a puuid, not gameName/tagLine,
// on current LCU versions. Two candidate endpoint shapes are tried since
// this one isn't as well-documented as current-summoner.
func resolveSummonerName(c *lcuClient, puuid string) string {
	if puuid == "" {
		return ""
	}
	for _, path := range []string{
		"/lol-summoner/v2/summoners/puuid/" + puuid,
		"/lol-summoner/v1/summoners?puuid=" + puuid,
	} {
		v, err := c.get(path)
		if err != nil || v == nil {
			continue
		}
		m := asMap(v)
		name := asString(m["gameName"])
		if name == "" {
			continue
		}
		if tag := asString(m["tagLine"]); tag != "" {
			return name + "#" + tag
		}
		return name
	}
	return ""
}

func getLobby(c *lcuClient) (Lobby, error) {
	v, err := c.get("/lol-lobby/v2/lobby")
	if err != nil {
		return Lobby{}, err
	}
	if v == nil {
		return Lobby{InLobby: false}, nil
	}
	m := asMap(v)
	localID := asInt(asMap(m["localMember"])["summonerId"])
	gameConfig := asMap(m["gameConfig"])

	// Looked up once per call, not once per member: cheap, and the local
	// player's name never differs between members in the same lobby.
	localName := currentSummonerName(c)

	var members []Member
	isLeader := false
	for _, item := range asList(m["members"]) {
		mm := asMap(item)
		id := asInt(mm["summonerId"])
		leader := asBool(mm["isLeader"])
		if id == localID && leader {
			isLeader = true
		}
		name := memberName(mm)
		if name == "" {
			if id == localID {
				name = localName
			} else {
				name = resolveSummonerName(c, asString(mm["puuid"]))
			}
		}
		if name == "" {
			name = fmt.Sprintf("Summoner %d", id)
		}
		members = append(members, Member{
			SummonerID: int64(id),
			Name:       name,
			IsLeader:   leader,
			FirstPos:   asString(mm["firstPositionPreference"]),
			SecondPos:  asString(mm["secondPositionPreference"]),
			IsLocal:    id == localID,
		})
	}

	return Lobby{
		InLobby:  true,
		QueueID:  asInt(gameConfig["queueId"]),
		IsLeader: isLeader,
		Members:  members,
		Raw:      v,
	}, nil
}

// selectQueue creates or switches the local lobby to a given queue. Solo
// lobby only (no pre-made party invite flow yet).
func selectQueue(c *lcuClient, queueID int) error {
	// POST, not PUT — confirmed against a real "WRONG_METHOD" 405 response.
	_, err := c.post("/lol-lobby/v2/lobby", map[string]interface{}{"queueId": queueID})
	return err
}

func setRolePreferences(c *lcuClient, first, second string) error {
	_, err := c.put("/lol-lobby/v2/lobby/members/localMember/position-preferences",
		map[string]interface{}{"firstPreference": first, "secondPreference": second})
	return err
}

func findMatch(c *lcuClient) error {
	_, err := c.post("/lol-lobby/v2/lobby/matchmaking/search", nil)
	return err
}

func cancelSearch(c *lcuClient) error {
	_, err := c.delete("/lol-lobby/v2/lobby/matchmaking/search")
	return err
}

func getSearchState(c *lcuClient) (SearchState, error) {
	v, err := c.get("/lol-lobby/v2/lobby/matchmaking/search-state")
	if err != nil {
		return SearchState{State: "Invalid"}, nil // not searching is normal, not an error
	}
	m := asMap(v)
	return SearchState{
		State:        asString(m["searchState"]),
		TimeInQueue:  asFloat(m["timeInQueue"]),
		EstimatedSec: asFloat(m["estimatedQueueTime"]),
		Raw:          v,
	}, nil
}

func getReadyCheck(c *lcuClient) (ReadyCheck, error) {
	v, err := c.get("/lol-matchmaking/v1/ready-check")
	if err != nil {
		return ReadyCheck{State: "Invalid"}, nil
	}
	m := asMap(v)
	return ReadyCheck{
		State:          asString(m["state"]),
		PlayerResponse: asString(m["playerResponse"]),
		Timer:          asFloat(m["timer"]),
	}, nil
}

func acceptReady(c *lcuClient) error {
	_, err := c.post("/lol-matchmaking/v1/ready-check/accept", nil)
	return err
}

func declineReady(c *lcuClient) error {
	_, err := c.post("/lol-matchmaking/v1/ready-check/decline", nil)
	return err
}
