# Task 1 Report: Third-Party License Validator

## Implementation

Added `scripts/validate-license-links.js`, a dependency-free Node.js validator. It requires `third-party-licenses.html`, verifies its exact `<title>` and `<h1>` values are `Third-Party Licenses`, and requires the exact license anchor in the bottom quarter of both `index.html` and `privacy.html`.

## Commands and results

```text
$ node scripts/validate-license-links.js
third-party-licenses.html is missing
index.html bottom content should include <a href="/third-party-licenses.html">Third-Party Licenses</a>
privacy.html bottom content should include <a href="/third-party-licenses.html">Third-Party Licenses</a>
exit: 1

$ node scripts/validate-homepage.js
Validated CyberGame homepage metadata: 3 JSON-LD blocks, 7 typed nodes.
exit: 0
```

## RED evidence

The new validator exits non-zero for the intended missing implementation: the license page does not exist and each required source-page link is absent. The failure is not caused by a script error.

## Files

- `scripts/validate-license-links.js` — new failing validator.
- `.superpowers/sdd/task-1-report.md` — this report.

## Commit

Commit subject: `Add third-party license link validator`.

## Self-check

The validator has no third-party dependencies, exits zero only when all required checks pass, and preserves the existing successful homepage validator.

## Concerns

None. This task intentionally leaves the validator RED until the license page and links are implemented by a later task.
