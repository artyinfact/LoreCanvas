# Work Packet Contract

Each packet must contain:

```json
{
  "id": "F-XX-engine",
  "owner": "engine",
  "status": "pending",
  "objective": "Observable behavior owned by this packet",
  "writeSet": ["src/engine/example.ts"],
  "dependsOn": [],
  "verification": ["npm.cmd exec -- vitest run tests/engine/example.test.ts"],
  "browserRequired": false,
  "humanGateIds": []
}
```

Rules:

- `writeSet` is exact; globs are allowed only for a new isolated directory.
- Shared files have one writer.
- A packet cannot mark the feature complete.
- The orchestrator integrates in dependency order.
- Every worker returns changed paths, verification output, and residual risk.
