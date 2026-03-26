---
name: lighthouse-audit
description: Run Lighthouse quality audits for accessibility, performance, SEO
argument-hint: "[url] [--categories=accessibility,performance]"
---

# Lighthouse Audit

Run Lighthouse audits against a running web server.

## Variables

URL: $ARGUMENTS (auto-detect if not provided)

## When to Run

Trigger this audit when the project mentions:
- Accessibility: "accessibility", "a11y", "WCAG", "contrast", "screen reader", "aria"
- Performance: "performance", "Core Web Vitals", "LCP", "FID", "CLS", "load time"
- SEO: "SEO", "meta tags", "search engine", "Open Graph"
- Frontend/UI: "frontend", "UI", "CSS", "HTML", "responsive", "mobile"

## Execution

1. **Auto-detect URL** (if not provided):
   ```bash
   for port in 3000 3001 3002 5173 5174 8080 8081 4200 4321; do
     curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" 2>/dev/null
   done
   ```

2. **Start dev server** if not running:
   ```bash
   npm start > /dev/null 2>&1 &
   SERVER_PID=$!
   sleep 5
   ```

3. **Run Lighthouse**:
   ```bash
   lighthouse http://localhost:3000 \
     --only-categories=accessibility,performance,best-practices \
     --output=json \
     --output-path=./lighthouse-report.json \
     --chrome-flags="--headless"
   ```

4. **Stop server**: `kill $SERVER_PID`

## Thresholds

| Category | Threshold | When Required |
|----------|-----------|---------------|
| Accessibility | >= 90 | If WCAG/a11y mentioned |
| Performance | >= 75 | If performance mentioned |
| Best Practices | >= 80 | Frontend projects |

## Output

Report scores with pass/fail against thresholds. Include `./lighthouse-report.json` path for details.

**Error Handling:** If server fails or Lighthouse errors, report the issue but don't fail the primary test suite. Lighthouse is supplemental.
