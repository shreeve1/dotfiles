# Verifier: Web-Searcher Conflicting Sources

## Target Agent
web-searcher (from agents/web-searcher.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Source Conflict Resolution (weight: 3)
- 5: Explicitly identifies the conflict between Source 1 (use multer-s3) and Sources 2-4 (don't use multer-s3 for this use case). Explains WHY they conflict: Source 1 is from 2019 and recommends aws-sdk v2, which is now deprecated; multer-s3 hasn't added v3 support; and multer-s3 doesn't support progress tracking which is a stated requirement. Does not treat all sources as equally valid.
- 3: Notes the conflict but doesn't explain why the sources disagree (recency, SDK version, feature gaps).
- 1: Presents all sources as alternatives without noting they contradict each other.
- 0: Recommends multer-s3 based on the high-upvote Stack Overflow answer.

### Criterion 2: Recency and Authority Weighting (weight: 3)
- 5: Weighs sources by recency AND authority. AWS docs (authoritative, current) and the 2026 blog post (recent, explains the landscape change) outweigh the 2019 Stack Overflow answer (outdated despite high votes). The npm page data (14 months stale, v2-only) corroborates that multer-s3 is not current. Explains the weighting logic.
- 3: Prefers newer sources but doesn't explicitly explain why older high-vote answers are less reliable.
- 1: Treats upvote count as a quality signal (gives Source 1 weight because of 2,847 upvotes).
- 0: Recommends the most-upvoted answer as the best option.

### Criterion 3: Requirement Mapping (weight: 2)
- 5: Maps the three stated requirements (50MB files, progress tracking, S3 destination) against each approach. Correctly identifies: (a) multer-s3 fails on progress tracking, (b) multer + @aws-sdk/lib-storage satisfies all three, (c) presigned URLs satisfy all three AND avoid server memory pressure for 50MB files. Makes the requirement-to-approach mapping explicit.
- 3: Covers the requirements but misses that multer-s3 specifically can't do progress tracking.
- 1: Generic recommendation without mapping to the specific requirements.
- 0: Ignores requirements (recommends something that doesn't support progress tracking).

### Criterion 4: Decision-Ready Recommendation (weight: 2)
- 5: Provides a clear recommendation with a primary approach and a noted alternative. States conditions under which you'd pick each ("presigned URLs if you want to avoid server memory pressure at 50MB; multer + lib-storage if you need server-side processing before S3"). Includes enough detail for the planner to start designing (which packages, which AWS SDK version, key integration pattern).
- 3: Has a recommendation but it's vague or doesn't include conditions for alternatives.
- 1: Presents a menu of options without recommending one.
- 0: No recommendation — just a summary of sources.

## Required Elements
- [ ] Identifies multer-s3 as NOT suitable (no progress tracking, aws-sdk v2 only)
- [ ] Does NOT recommend the 2019 Stack Overflow approach for this use case
- [ ] Recommends either presigned URLs or multer + @aws-sdk/lib-storage (both are valid)
- [ ] Explains why the high-upvote answer is outdated (SDK version, feature gap)
- [ ] Maps requirements (50MB, progress, S3) to the recommended approach

## Anti-Patterns
- Recommends multer-s3 because of 2,847 upvotes (popularity ≠ currency)
- Treats all 5 sources as equally valid without noting the 2019→2026 landscape change
- Presents a menu of 3+ options without a recommendation
- Ignores the progress tracking requirement (it eliminates multer-s3)
- Recommends aws-sdk v2 when v3 is current and v2 is deprecated
