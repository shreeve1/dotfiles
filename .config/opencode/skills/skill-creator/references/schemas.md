# JSON Schemas

This document defines the JSON schemas used by the skill-creator workflow.

---

## evals.json

Defines the evals for a skill. Located at `<skill-name>-workspace/evals/evals.json`.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's example prompt",
      "expected_output": "Description of expected result",
      "files": ["evals/files/sample1.pdf"],
      "expectations": [
        "The output includes X",
        "The skill used script Y"
      ]
    }
  ]
}
```

**Fields:**
- `skill_name`: Name matching the skill's frontmatter
- `evals[].id`: Unique integer identifier
- `evals[].prompt`: The task to execute
- `evals[].expected_output`: Human-readable description of success
- `evals[].files`: Optional list of input file paths (relative to skill root)
- `evals[].expectations`: List of verifiable statements (assertions)

---

## eval_metadata.json

Per-eval metadata stored at `<workspace>/iteration-<N>/eval-<ID>/eval_metadata.json`.

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": [
    "The output includes a summary section",
    "All input data points are represented in the chart"
  ]
}
```

**Fields:**
- `eval_id`: Numeric identifier matching `evals.json`
- `eval_name`: Human-readable name (used for directory naming and display)
- `prompt`: The task prompt for this eval
- `assertions`: List of verifiable expectations to grade against

---

## grading.json

Output from the grader agent. Located at `<run-dir>/grading.json`.

```json
{
  "expectations": [
    {
      "text": "The output includes the name 'John Smith'",
      "passed": true,
      "evidence": "Found in transcript Step 3: 'Extracted names: John Smith, Sarah Johnson'"
    },
    {
      "text": "The spreadsheet has a SUM formula in cell B10",
      "passed": false,
      "evidence": "No spreadsheet was created. The output was a text file."
    }
  ],
  "summary": {
    "passed": 2,
    "failed": 1,
    "total": 3,
    "pass_rate": 0.67
  },
  "claims": [
    {
      "claim": "The form has 12 fillable fields",
      "type": "factual",
      "verified": true,
      "evidence": "Counted 12 fields in field_info.json"
    }
  ],
  "eval_feedback": {
    "suggestions": [
      {
        "assertion": "The output includes the name 'John Smith'",
        "reason": "A hallucinated document that mentions the name would also pass"
      }
    ],
    "overall": "Assertions check presence but not correctness."
  }
}
```

**Fields:**
- `expectations[]`: Graded expectations with evidence
  - `text`: The original expectation text
  - `passed`: Boolean — true if expectation passes
  - `evidence`: Specific quote or description supporting the verdict
- `summary`: Aggregate pass/fail counts
  - `passed`: Count of passed expectations
  - `failed`: Count of failed expectations
  - `total`: Total expectations evaluated
  - `pass_rate`: Fraction passed (0.0 to 1.0)
- `claims`: Extracted and verified claims from the output
  - `claim`: The statement being verified
  - `type`: "factual", "process", or "quality"
  - `verified`: Boolean
  - `evidence`: Supporting or contradicting evidence
- `eval_feedback`: Improvement suggestions for the evals (only when warranted)
  - `suggestions`: Concrete suggestions with `reason` and optionally `assertion`
  - `overall`: Brief assessment

**Important:** The `expectations` array must use the fields `text`, `passed`, and `evidence` — not `name`/`met`/`details` or other variants.

---

## feedback.json

User feedback collected after presenting results. Located at `<workspace>/iteration-<N>/feedback.json`.

```json
{
  "reviews": [
    {
      "eval_name": "descriptive-name",
      "feedback": "the chart is missing axis labels",
      "timestamp": "2026-01-15T10:30:00Z"
    },
    {
      "eval_name": "another-test",
      "feedback": "",
      "timestamp": "2026-01-15T10:31:00Z"
    }
  ],
  "status": "complete"
}
```

**Fields:**
- `reviews[]`: One entry per eval
  - `eval_name`: Matches the eval_metadata eval_name
  - `feedback`: User's comments (empty means it looked fine)
  - `timestamp`: ISO timestamp
- `status`: "complete" when user has reviewed all evals

---

## benchmark_summary.json

Aggregate comparison between skill and baseline. Located at `<workspace>/iteration-<N>/benchmark_summary.json`.

```json
{
  "metadata": {
    "skill_name": "example-skill",
    "iteration": 1,
    "timestamp": "2026-01-15T10:30:00Z",
    "evals_run": [1, 2, 3]
  },
  "results": [
    {
      "eval_id": 1,
      "eval_name": "descriptive-name",
      "with_skill": {
        "pass_rate": 0.85,
        "passed": 6,
        "failed": 1,
        "total": 7
      },
      "baseline": {
        "pass_rate": 0.35,
        "passed": 2,
        "failed": 5,
        "total": 7
      },
      "delta": "+0.50"
    }
  ],
  "aggregate": {
    "with_skill_avg_pass_rate": 0.82,
    "baseline_avg_pass_rate": 0.40,
    "overall_delta": "+0.42"
  },
  "notes": [
    "Assertion 'Output is a PDF file' passes 100% in both configurations",
    "Eval 3 shows high variance — may be flaky",
    "Skill adds meaningful improvement on table extraction expectations"
  ]
}
```

**Fields:**
- `metadata`: Information about the benchmark
- `results[]`: Per-eval comparison
  - `with_skill` / `baseline`: Pass rate and counts
  - `delta`: Difference string
- `aggregate`: Overall summary statistics
- `notes`: Freeform observations

---

## comparison.json

Output from blind comparator. Located at `<run-dir>/comparison.json`.

```json
{
  "winner": "A",
  "reasoning": "Output A provides a complete solution with proper formatting and all required fields.",
  "rubric": {
    "A": {
      "content": {
        "correctness": 5,
        "completeness": 5,
        "accuracy": 4
      },
      "structure": {
        "organization": 4,
        "formatting": 5,
        "usability": 4
      },
      "content_score": 4.7,
      "structure_score": 4.3,
      "overall_score": 9.0
    },
    "B": {
      "content": {
        "correctness": 3,
        "completeness": 2,
        "accuracy": 3
      },
      "structure": {
        "organization": 3,
        "formatting": 2,
        "usability": 3
      },
      "content_score": 2.7,
      "structure_score": 2.7,
      "overall_score": 5.4
    }
  },
  "output_quality": {
    "A": {
      "score": 9,
      "strengths": ["Complete solution", "Well-formatted"],
      "weaknesses": ["Minor style inconsistency"]
    },
    "B": {
      "score": 5,
      "strengths": ["Readable output"],
      "weaknesses": ["Missing date field", "Formatting issues"]
    }
  },
  "expectation_results": {
    "A": {
      "passed": 4,
      "total": 5,
      "pass_rate": 0.80,
      "details": [
        {"text": "Output includes name", "passed": true},
        {"text": "Output includes date", "passed": true}
      ]
    },
    "B": {
      "passed": 3,
      "total": 5,
      "pass_rate": 0.60,
      "details": [
        {"text": "Output includes name", "passed": true},
        {"text": "Output includes date", "passed": false}
      ]
    }
  }
}
```

---

## analysis.json

Output from post-hoc analyzer. Located at `<run-dir>/analysis.json`.

```json
{
  "comparison_summary": {
    "winner": "A",
    "winner_skill": "path/to/winner/skill",
    "loser_skill": "path/to/loser/skill",
    "comparator_reasoning": "Brief summary of why comparator chose winner"
  },
  "winner_strengths": [
    "Clear step-by-step instructions for handling multi-page documents",
    "Included validation script that caught formatting errors"
  ],
  "loser_weaknesses": [
    "Vague instruction 'process the document appropriately' led to inconsistent behavior",
    "No script for validation, agent had to improvise"
  ],
  "improvement_suggestions": [
    {
      "priority": "high",
      "category": "instructions",
      "suggestion": "Replace vague instruction with explicit steps",
      "expected_impact": "Would eliminate ambiguity"
    }
  ],
  "transcript_insights": {
    "winner_execution_pattern": "Read skill -> Followed 5-step process -> Used validation script",
    "loser_execution_pattern": "Read skill -> Unclear on approach -> Tried 3 different methods"
  }
}
```

---

## trigger_eval.json

Eval set for description optimization. Located at `<workspace>/trigger_eval.json`.

```json
[
  {
    "query": "ok so my boss just sent me this xlsx file and she wants me to add a profit margin column",
    "should_trigger": true
  },
  {
    "query": "help me write a Python function that calculates fibonacci numbers",
    "should_trigger": false
  }
]
```

**Fields:**
- `query`: A realistic user prompt
- `should_trigger`: Whether this skill should activate for this query

---

## history.json

Tracks version progression across iterations. Located at workspace root.

```json
{
  "started_at": "2026-01-15T10:30:00Z",
  "skill_name": "example-skill",
  "current_best": "iteration-2",
  "iterations": [
    {
      "version": "iteration-1",
      "parent": null,
      "avg_pass_rate": 0.65,
      "feedback_summary": "Missing axis labels, chart colors wrong"
    },
    {
      "version": "iteration-2",
      "parent": "iteration-1",
      "avg_pass_rate": 0.85,
      "feedback_summary": "Looks great, minor formatting nit"
    }
  ]
}
```
