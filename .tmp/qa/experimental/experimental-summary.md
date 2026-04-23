# Experimental Summary

- Generated At: 2026-04-23T15:06:58.339Z
- Node: v22.20.0
- Platform: darwin
- CPU: Apple M4
- Memory: 16.00 GiB

## Performance

- Run ID: 2026-04-23T15-03-26-839Z
- Profile: smoke
- Generated At: 2026-04-23T15:04:42.272Z

| Scenario | Endpoint | Module | Avg (ms) | P95 (ms) | Error % | RPS | Pass |
|---|---|---|---:|---:|---:|---:|---|
| normal | auth_login | auth | 281.20 | 446 | 0.000 | 19.01 | Yes |
| normal | auth_me | auth | 0.82 | 2 | 0.000 | 6474.73 | Yes |
| normal | admin_reports_list | authorization | 1.10 | 2 | 0.000 | 4832.33 | Yes |
| normal | posts_list | content | 3.92 | 5 | 0.000 | 1360.26 | Yes |
| normal | workspace_posts | content | 2.25 | 3 | 0.000 | 2368.75 | Yes |

## Mutation

- Generated At: 2026-04-23T15:04:56.602Z
- Totals: created=8, killed=7, survived=1, errors=0, score=87.50%

| Module | Created | Killed | Survived | Score % |
|---|---:|---:|---:|---:|
| auth | 2 | 2 | 0 | 100 |
| authorization | 2 | 2 | 0 | 100 |
| content | 4 | 3 | 1 | 75 |

Survived mutants:
- content-visibility-status (content): Treat non-published status as published in visibility guard

## Chaos

- Run ID: 2026-04-23T15-05-10-852Z
- Generated At: 2026-04-23T15:06:38.315Z

| Scenario | Availability % | Failed Probes | Recovery (ms) | Degradation |
|---|---:|---:|---:|---|
| api-downtime | 53.33 | 7 / 15 | 315 | user-visible-errors |
| db-unavailable | 100 | 0 / 28 | 201 | graceful |
| network-latency | 100 | 0 / 23 | 112 | graceful |

