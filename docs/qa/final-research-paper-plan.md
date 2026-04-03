# Final Research Paper Plan for Inkwell Platform

## Purpose

This document formalizes what the final course paper must contain for the **Inkwell Platform** project, based on:

- the explicit research-paper requirements stated in **Assignment 1**
- the explicit research-paper requirements stated in **Assignment 2**
- the teacher feedback notes received after Assignment 1

The key interpretation is:

- some items are **invariants** because they are required directly by Assignment 1 and Assignment 2
- some items are **likely mandatory manuscript components** because they appeared in the teacher feedback as a clear paper structure
- some items are **optional comparative directions**, not predetermined obligations, and should be treated as research design choices unless the teacher later confirms them as mandatory

The final output should be a **single coherent academic paper/report**, not a bundle of separate QA project artifacts.

## 1. Research-Paper Requirements Extracted from Assignment 1

### 1.1 What Assignment 1 explicitly says to capture for the paper

Assignment 1 requires the future research paper to capture:

- **System description**: a brief overview of the chosen system
- **Risk assessment methodology**: reasoning, assumptions, and prioritization
- **Environment setup**: tools, CI/CD configuration, and repository structure
- **Initial metrics**: a baseline for later analysis of performance, coverage, or defect reduction

### 1.2 How Assignment 1 explicitly says it contributes to the final paper

Assignment 1 states that it should:

- form the **Introduction** and **Methodology** chapters of the research paper
- provide the baseline that later assignments extend
- supply screenshots, configurations, and initial scripts as **reproducibility evidence**

### 1.3 Invariant interpretation for this project

For the Inkwell project, the following are therefore mandatory in the final paper:

- a concise but academically written system overview
- a formal explanation of the risk-based testing method used in the project
- a documented QA environment and CI/CD setup
- a baseline metrics section that clearly distinguishes Assignment 1 baseline from later results

## 2. Research-Paper Requirements Extracted from Assignment 2

### 2.1 What Assignment 2 explicitly says should feed into the paper

Assignment 2 states that the updated QA strategy document should become a foundation for the paper's:

- **Methodology section**: automation tools, approach, CI/CD integration, quality gates
- **Results section**: baseline metrics from automated runs, including coverage, execution time, and defects found
- **Discussion section**: comparison of expected risk vs actual defects, plus analysis of automation effectiveness
- **Reproducibility evidence**: screenshots, logs, and code snippets showing the work can be rerun

### 2.2 How Assignment 2 explicitly says it builds toward the final project

Assignment 2 says it should:

- provide measurable results for Assignment 3
- supply metrics and insights for Assignment 4
- demonstrate the practical value of automation in QA research

### 2.3 Invariant interpretation for this project

For the Inkwell project, the following are therefore mandatory in the final paper:

- an automation methodology section, not only a list of test scripts
- a results section grounded in measured artifacts, not just descriptions
- a discussion section that interprets metrics relative to the earlier risk model
- an explicit reproducibility layer using real project evidence

## 3. Formalized Interpretation of Teacher Feedback

### 3.1 Likely mandatory manuscript components

The first feedback note appears to describe the expected structure of the final paper and should be treated as **likely mandatory** unless the teacher later narrows it:

- research questions
- abstract
- introduction
- methodology
- literature review
- tech stack justification
- tool stack justification
- comparative analysis with other tools/technologies
- metric justification

Interpretation:

- these should not remain scattered across QA documents
- they should be assembled into one academic narrative
- each item should appear as a distinct subsection or clearly identifiable part of the final paper

### 3.2 Optional comparative directions from teacher feedback

The second feedback note should be treated as a **comparative direction**, not automatically as a fixed required experiment:

- compare with other QA frameworks/stacks
- possibly include **AI-assisted** or **AI-driven** QA approaches as a comparison dimension

Interpretation:

- a comparison with alternative frameworks/tools is very likely expected
- an AI-assisted/AI-driven comparison is a **valid option**, but should be treated as one possible comparative lens, not as a predetermined required implementation branch
- if this AI-related angle is included, it should be presented either:
  - as a literature-grounded comparative subsection, or
  - as a scoped discussion topic
- it should **not** be presented as an empirical result unless a real comparison experiment is actually run

## 4. Final Paper Structure for This Project

The recommended final structure for the Inkwell course paper is:

1. **Title**
2. **Abstract**
3. **Introduction**
4. **Research Questions and Objectives**
5. **Literature Review**
6. **System Context and Problem Definition**
7. **Methodology**
8. **Results**
9. **Discussion**
10. **Limitations and Threats to Validity**
11. **Conclusion**
12. **References**
13. **Appendices / Reproducibility Evidence** (if allowed by course format)

This structure satisfies both the assignment requirements and the teacher feedback while keeping the final work as one coherent academic document.

## 5. What Each Section Should Contain for Inkwell

### 5.1 Abstract

Must summarize:

- the system under test
- the QA problem being addressed
- the chosen methodology
- the main measured results
- the practical/research contribution

### 5.2 Introduction

Must explain:

- why the Inkwell Platform is a suitable QA subject
- why risk-based prioritization is necessary for this system
- what problem the paper solves
- why the work matters beyond simple project documentation

### 5.3 Research Questions and Objectives

Recommended core RQs for this project:

1. **RQ1:** To what extent does a risk-based automation strategy provide effective coverage of the highest-risk modules in the Inkwell Platform?
2. **RQ2:** How much do CI quality gates improve the reproducibility and actionability of QA results compared with raw test execution alone?
3. **RQ3:** How well does the selected QA stack fit this project compared with realistic alternative toolchains, in terms of maintainability, execution efficiency, and evidence quality?

Optional extension:

4. **RQ4 (optional):** How does the selected manual-plus-automation workflow compare conceptually with AI-assisted or AI-driven QA approaches described in the literature?

### 5.4 Literature Review

Must become a real academic section, not a short contextual note. It should cover:

- risk-based testing
- test pyramid / layered automation strategy
- CI/CD and shift-left QA
- quality gates and reproducibility in testing
- test metrics and their limitations
- comparative literature on UI/API test frameworks
- optionally, literature on AI-assisted or AI-driven software testing

### 5.5 System Context and Problem Definition

This section should define:

- the Inkwell architecture at a high level
- the core risk-bearing modules
- why these modules create a meaningful QA research setting

### 5.6 Methodology

This section should merge Assignment 1 and Assignment 2 into one coherent method chapter:

- risk assessment method
- prioritization logic
- QA environment and CI/CD setup
- automation strategy
- tool selection and justification
- quality gate definitions
- metrics and evidence collection
- reproducibility design

Important:

- **tech stack justification** and **tool stack justification** should be separate subsections
- **comparative analysis** should not be mixed randomly into results; it should be framed methodologically or in literature/discussion

### 5.7 Results

This section should present measured outcomes only:

- automation coverage
- API and browser execution results
- quality gate results
- execution times
- defect-vs-risk results
- evidence references

### 5.8 Discussion

This section should interpret the results:

- did the risk model work?
- did the quality-gate model improve clarity and reproducibility?
- what do the metrics actually show?
- where did the automation strategy succeed and where does it remain limited?
- how does the chosen stack compare with alternatives?

### 5.9 Limitations and Threats to Validity

This must be explicit. It should include:

- metric validity limits
- coverage limitations
- external validity limits
- construct validity risks
- internal validity risks
- reproducibility risks

### 5.10 Conclusion

Must close the paper academically:

- restate the problem
- summarize the findings
- answer the research questions
- state the main contribution
- suggest realistic future work

## 6. Project-Specific Mapping from Existing Artifacts to the Final Paper

| Final paper need | Existing project material | Current status | What still needs to be done |
| ---------------- | ------------------------- | -------------- | --------------------------- |
| System description | `docs/qa/risk-assessment.md`, Assignment 1 report, `README.md` | partially available | rewrite as academic system-context prose |
| Research questions | `docs/qa/test-strategy.md`, `docs/qa/qa-methodology-report.md` | available | finalize one stable RQ set for the paper |
| Risk methodology | `docs/qa/risk-assessment.md`, Assignment 1 report | available | rewrite into one methodology subsection |
| Automation methodology | `docs/qa/test-strategy.md`, `docs/qa/assignment-2-report.md` | available | synthesize into one coherent methodology chapter |
| Tool/stack justification | `docs/qa/test-strategy.md`, `docs/qa/qa-methodology-report.md` | available | rewrite in a more academic style with citations |
| Results and metrics | `docs/qa/baseline-metrics.md`, `docs/qa/assignment-2-report.md`, `.tmp/qa/`, `server/coverage/` | available | convert into paper-grade results narrative and charts |
| Discussion | partly in `docs/qa/qa-methodology-report.md` | partial | write full discussion tied to RQs |
| Literature review | minimal notes only | missing | build from real academic/industry sources |
| References / bibliography | not assembled | missing | create a proper reference list |
| Threats to validity | only partial limitations notes | partial | write formal validity/limitations section |
| Final academic narrative | spread across multiple QA docs | missing | merge into one final paper |

## 7. Literature Review Plan

### 7.1 Minimum target

The final literature review should include real sources across at least these categories:

- foundational testing/process literature
- risk-based testing literature
- automated testing and test pyramid literature
- CI/CD / shift-left QA literature
- software quality measurement literature
- framework/tool comparison literature
- optional AI-assisted testing literature

### 7.2 Source strategy

Recommended source types:

- peer-reviewed papers
- conference papers
- books or book chapters
- respected standards/guidelines
- official framework documentation only as supporting technical references, not as the whole literature review

### 7.3 Output requirement

The literature review should end with:

- a properly formatted **References** section
- in-text citations throughout the paper
- a clear explanation of how the literature supports the chosen methodology and comparison design

## 8. Comparative Analysis Plan

### 8.1 Mandatory comparison axis

The final paper should compare the chosen stack against realistic alternatives, for example:

- `Vitest + Supertest` vs `Jest + Supertest`
- `Playwright` vs `Cypress`
- repository-native tests vs `Postman/Newman` as the primary API automation layer
- `GitHub Actions` vs local-only execution or heavier CI systems

Comparison criteria should be academic and explicit:

- maintainability
- execution speed
- integration with the project stack
- artifact quality
- reproducibility
- suitability for risk-based testing

### 8.2 Optional AI-assisted comparison axis

If included, the AI-assisted/AI-driven angle should be framed carefully:

- compare conceptually, not rhetorically
- use literature and documented limitations
- avoid claiming superiority without a real experiment

Good ways to include it:

- as a subsection in the literature review
- as part of the comparative analysis
- as a future-work or discussion subsection

Bad way to include it:

- making unsupported claims that AI-driven QA is better or worse without evidence

## 9. Metrics Validity and Limitations Plan

The paper should not only list metrics. It should justify them and acknowledge their limits.

### 9.1 Metrics to justify

- automation coverage of high-risk modules
- `P1` automation coverage
- backend statement coverage
- backend line coverage
- API pass/fail counts
- browser smoke pass/fail counts
- execution time
- defects found vs expected risk
- quality-gate status

### 9.2 Validity questions to answer

For each major metric, the paper should answer:

- what does this metric actually measure?
- why is it relevant to the research questions?
- what can it not prove?
- what threats or biases affect interpretation?

### 9.3 Example limitations to state explicitly

- coverage does not guarantee correctness
- smoke tests do not guarantee exhaustive UI quality
- expected-defect counts are a reporting proxy, not observed bug truth
- execution time depends on environment and pipeline overhead
- current results are project-specific and may not generalize directly to all systems

## 10. Final Writing Plan

### Phase 1. Freeze research design

- finalize the research questions
- finalize the paper structure
- decide whether the AI-assisted comparison remains optional or is included

### Phase 2. Build the literature review

- collect real sources
- cluster them by topic
- write the literature review with citations
- prepare the references list

### Phase 3. Consolidate methodology

- merge Assignment 1 and Assignment 2 content into one methodology chapter
- separate system/tech stack justification from tool stack justification
- formalize quality gates and metric design

### Phase 4. Assemble results

- bring forward the baseline and current metrics
- create final charts/tables for the paper
- ensure results are aligned with the research questions

### Phase 5. Write discussion and validity sections

- answer each research question explicitly
- write comparative analysis
- write limitations
- write threats to validity

### Phase 6. Final paper integration

- write abstract
- finalize introduction and conclusion
- ensure the paper reads as one academic narrative
- move implementation-heavy material into appendices if needed

## 11. Final Formalization: What Is Mandatory vs Optional

### Mandatory for the final paper

- single coherent academic paper/report
- abstract
- introduction
- research questions
- methodology
- literature review
- system description
- risk assessment and prioritization logic
- environment and CI/CD description
- tool stack justification
- tech stack justification
- metrics and results
- discussion
- limitations / threats to validity
- conclusion
- proper references / bibliography
- reproducibility evidence

### Strongly expected

- comparative analysis with alternative QA tools/frameworks
- explicit justification of chosen metrics
- explicit linkage from research questions to results and discussion

### Optional unless later confirmed by the teacher

- AI-assisted / AI-driven QA as a dedicated comparative branch
- a separate empirical experiment comparing the chosen stack to an AI-based workflow

## 12. Practical Bottom Line for This Project

The Inkwell repository already contains enough material to support:

- the system description
- the risk-based methodology
- the QA environment and CI/CD setup
- the automation and quality-gate methodology
- the baseline and current metrics
- the reproducibility evidence

What is still missing is the **academic synthesis layer**:

- literature review with real sources
- one coherent paper narrative
- formal comparative analysis
- metric validity argumentation
- discussion / threats to validity / conclusion sections written as research, not as project notes

That academic synthesis is now the main remaining task.
