# Security Audit Report

Date: 2026-03-24

## Scope

- Dependency audit (root workspace)
- Dependency audit (web app package)
- Source scan for common unsafe script/DOM patterns
- Existing endpoint hardening review for checkout/portal edge functions

## Commands Run

- `npm audit`
- `npm --prefix apps/web audit`
- `Get-ChildItem -Path apps/web/src -Recurse -Include *.js,*.jsx,*.ts,*.tsx | Select-String -Pattern 'dangerouslySetInnerHTML|innerHTML\\s*=|eval\\(|new Function\\(|document\\.write\\('`

## Findings

1. Root dependency audit
- Result: 0 vulnerabilities

2. Web dependency audit
- Initial result: moderate issues in Vitest chain (`vitest`, `vite-node`, `vite`, `esbuild`)
- Action taken: upgraded `vitest` to `^3.2.4`
- Final result: 0 vulnerabilities

3. Source pattern scan
- No matches for high-risk DOM/script patterns:
  - `dangerouslySetInnerHTML`
  - `innerHTML =`
  - `eval(`
  - `new Function(`
  - `document.write(`

4. Edge function controls verified
- Rate limiting in checkout/portal functions
- Input validation and sanitized return URLs
- Trusted origin checks for CSRF-style request rejection
- CORS restricted to configured `ALLOWED_ORIGINS`

## Residual Risk

- Deno edge-function files show local editor TypeScript diagnostics in non-Deno environments. This is an editor/type tooling mismatch, not a runtime security issue.

## Status

- Security audit: completed
- Recommended cadence: rerun dependency audit before each release and after dependency updates
