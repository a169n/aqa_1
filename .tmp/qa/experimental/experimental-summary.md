# Experimental Summary

- Generated At: 2026-04-23T15:36:40.227Z
- Node: v22.20.0
- Platform: darwin
- CPU: Apple M4
- Memory: 16.00 GiB

## Performance

- Run ID: 2026-04-23T15-33-17-922Z
- Profile: smoke
- Generated At: 2026-04-23T15:34:33.289Z

| Scenario | Endpoint | Module | Avg (ms) | P95 (ms) | Error % | RPS | Pass |
|---|---|---|---:|---:|---:|---:|---|
| normal | auth_login | auth | 281.71 | 428 | 0.000 | 18.96 | Yes |
| normal | auth_me | auth | 0.86 | 2 | 0.000 | 6186.93 | Yes |
| normal | admin_reports_list | authorization | 1.23 | 2 | 0.000 | 4326.31 | Yes |
| normal | posts_list | content | 3.95 | 6 | 0.000 | 1348.82 | Yes |
| normal | workspace_posts | content | 2.40 | 4 | 0.000 | 2217.45 | Yes |

## Mutation

- Generated At: 2026-04-23T15:34:47.957Z
- Totals: created=8, killed=7, survived=1, errors=0, score=87.50%

| Module | Created | Killed | Survived | Score % |
|---|---:|---:|---:|---:|
| auth | 2 | 2 | 0 | 100 |
| authorization | 2 | 2 | 0 | 100 |
| content | 4 | 3 | 1 | 75 |

Survived mutants:
- content-visibility-status (content): Treat non-published status as published in visibility guard

## Chaos

- Run ID: 2026-04-23T15-35-04-801Z
- Generated At: 2026-04-23T15:36:31.549Z

| Scenario | Availability % | Failed Probes | Recovery (ms) | Degradation |
|---|---:|---:|---:|---|
| api-downtime | 53.33 | 7 / 15 | 201 | user-visible-errors |
| db-unavailable | 25 | 21 / 28 | 1401 | user-visible-errors |
| network-latency | 42.11 | 11 / 19 | 158 | user-visible-errors |

