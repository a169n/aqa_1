# Baseline Metrics and Evidence Plan

## Baseline metrics

| Metric                              | Baseline                                                   |
| ----------------------------------- | ---------------------------------------------------------- |
| High-risk modules                   | `5`                                                        |
| `P1` modules automated              | `3 / 3`                                                    |
| API automated scenarios             | `19`                                                       |
| UI smoke scenarios                  | `3`                                                        |
| Observed backend statement coverage | `85.75%`                                                   |
| Observed backend line coverage      | `85.30%`                                                   |
| Planned backend coverage target     | `>= 80%` for included business-critical server files       |
| Pipeline stages                     | `5` (`lint`, `build`, `api-tests`, `e2e`, `docker-build`)  |
| Lint gate commands                  | `format:check`, `lint`, `lint:fix`, `git diff --exit-code` |

## Estimated effort

| Work item                         | Estimate   |
| --------------------------------- | ---------- |
| QA environment and docs           | `2 days`   |
| API integration suite             | `2-3 days` |
| Playwright smoke suite            | `1 day`    |
| CI hardening and artifact uploads | `0.5 day`  |
| Final evidence packaging          | `0.5 day`  |

## Baseline evidence to capture

- `Swagger` page showing the API documentation
- successful API test run with coverage output
- successful Playwright run and report
- successful GitHub Actions workflow
- successful backend Docker image build
- repository screenshot showing the QA folder and test structure

## Manual follow-up coverage

- invalid route handling
- logout behavior from the UI
- session refresh behavior after token expiry
- avatar upload UX and feedback
- search and feed behavior under different data sets

## Notes for the research paper

- These metrics form the initial methodology baseline for later comparison.
- The risk matrix and pipeline outputs can be reused in the Introduction and Methodology sections.
- Screenshots should be saved under `docs/qa/screenshots/` when the final evidence is collected.
