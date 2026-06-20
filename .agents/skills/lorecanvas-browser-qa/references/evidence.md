# Browser Evidence Schema

Return:

```json
{
  "surface": "in-app-browser",
  "developerMode": false,
  "url": "http://127.0.0.1:5173/",
  "viewport": "1440x900",
  "preconditions": ["empty scenario"],
  "actions": ["open workbench", "select movement target"],
  "assertions": [
    {"name": "page identity", "result": "pass", "evidence": "title LoreCanvas"},
    {"name": "console", "result": "pass", "evidence": "0 unexpected errors"}
  ],
  "artifacts": [],
  "result": "pass",
  "residualRisks": []
}
```

When a screenshot is material, include its absolute path or browser artifact
reference. For a failure, include the first reproducible failing action and the
authoritative observed signal.
