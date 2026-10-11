package main

// The LCU API is unofficial and loosely specified, so responses are decoded
// to interface{} and read defensively with these helpers.

func asMap(v interface{}) map[string]interface{} {
	if m, ok := v.(map[string]interface{}); ok {
		return m
	}
	return map[string]interface{}{}
}

func asList(v interface{}) []interface{} {
	if l, ok := v.([]interface{}); ok {
		return l
	}
	return nil
}

func asString(v interface{}) string {
	s, _ := v.(string)
	return s
}

func asBool(v interface{}) bool {
	b, _ := v.(bool)
	return b
}

func asInt(v interface{}) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	}
	return 0
}

func asFloat(v interface{}) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case int:
		return float64(n)
	}
	return 0
}
