{
	"id": "planeat-4ga2",
	"lang": "typescript",
	"global_cors": {
		"allow_origins_without_credentials": ["*"],
		"allow_origins_with_credentials": [
			"https://www.planeat.life",
			"https://planeat.life",
			"http://localhost:*"
		]
	},
	"infra": {
		"postgres": {
			"provider": "neon",
			"neon": {
				"org_id": "org-twilight-glitter-37431007"
			}
		}
	}
}
