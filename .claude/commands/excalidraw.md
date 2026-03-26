---
description: Interview-driven Excalidraw diagram creation. Gathers requirements through questions, then generates and exports a diagram.
argument-hint: [optional topic, e.g. "system architecture" or "CI/CD pipeline"]
model: sonnet
---

# Excalidraw Diagram Generator

Create Excalidraw diagrams through a guided interview that understands what you need before drawing anything.

## Variables

TOPIC: $ARGUMENTS — Optional diagram topic or description

## Instructions

### Phase 1: Load Excalidraw Format Reference

1. Call `mcp-cli call excalidraw/read_me '{}'` via Bash to load the element format, color palette, and examples. Store this knowledge for Phase 3. **Only do this once per session.**

### Phase 2: Interview — Understand the Diagram

Conduct a focused interview using `AskUserQuestion` to understand what to draw. Adapt questions based on TOPIC if provided.

**Round 1 — Diagram Type:**

Ask what kind of diagram they need:

| Option | Description |
|--------|-------------|
| Architecture | System components, services, infrastructure |
| Flowchart | Process steps, decision trees, workflows |
| Sequence | Interactions between actors over time |
| Entity Relationship | Data models, relationships, cardinality |
| Network / Topology | Nodes, connections, layers |
| Freeform / Other | Custom layout — describe what you need |

**Round 2 — Content & Components:**

Based on diagram type, ask about:
- **What are the main components/nodes?** (list them)
- **What connects to what?** (relationships, data flow direction)
- **Are there groups or layers?** (e.g. frontend / backend / database zones)

Use AskUserQuestion with relevant options based on their answers. Ask 1-2 questions at a time, not a wall of text.

**Round 3 — Style & Details:**

- **Labels**: Do components need subtitles or annotations?
- **Color coding**: Should different groups have different colors? (Use the Excalidraw palette from read_me)
- **Scale**: Roughly how many elements? (simple: 3-6, medium: 7-15, complex: 16+)

**Round 4 — Confirmation:**

Summarize what you'll draw in plain text:
```
I'll create a [type] diagram with:
- [Component A] → [Component B] → [Component C]
- Grouped into [Zone 1] and [Zone 2]
- Color coded: [scheme]
```

Ask: "Does this look right, or should I adjust anything?"

### Phase 3: Generate the Diagram

Using the element format from Phase 1 and requirements from Phase 2:

#### Step 1: Plan the Layout

Calculate positions so elements don't overlap. Use consistent spacing:
- 200px+ between nodes horizontally
- 150px+ between rows vertically
- Zone backgrounds sized with 30px padding around all contained elements
- Title text at y=20, centered over the full diagram width

**Camera sizing** — pick the right viewport from read_me based on content:
- Small (2-4 elements): 400x300
- Medium (5-10 elements): 800x600
- Large (11-20 elements): 1200x900
- Very large (20+ elements): 1600x1200

Always use 4:3 ratio. At XL/XXL sizes, increase fontSize to 20+ for readability.

#### Step 2: Build the Elements JSON

##### CRITICAL — read_me Override Notice

> The `read_me` format reference calls the `label` field on shapes "PREFERRED" and uses it extensively in examples. **Ignore this recommendation.** The `label` field does not reliably render visible text on shapes OR arrows in practice. All read_me examples using `label` should be mentally translated to standalone `text` elements.

##### Text Rendering Rule — The #1 Rule

> **NEVER use the `label` field on ANY element — not shapes, not arrows, not anything.**
> **ALWAYS use standalone `text` elements** for every piece of visible text in the diagram.

This applies to:
- Rectangle labels — use a paired `text` element
- Ellipse labels — use a paired `text` element
- Diamond labels — use a paired `text` element
- Arrow labels — use a `text` element positioned at the arrow's midpoint
- Zone titles — use a `text` element positioned inside the zone's top area

##### Pairing Shapes with Text

For every shape, immediately follow it with its `text` element:

```json
{ "type": "rectangle", "id": "box1", "x": 200, "y": 300, "width": 160, "height": 70,
  "backgroundColor": "#a5d8ff", "fillStyle": "solid", "roundness": {"type": 3},
  "strokeColor": "#4a9eed", "strokeWidth": 2 },
{ "type": "text", "id": "box1_lbl", "x": 235, "y": 326,
  "text": "PBX Server", "fontSize": 18, "strokeColor": "#1e1e1e" }
```

**Text centering formula** (use every time):
- `text.x = shape.x + (shape.width / 2) - (text.length * fontSize * 0.25)`
- `text.y = shape.y + (shape.height / 2) - (fontSize / 2)`

For multi-line text, subtract `(lineCount * fontSize * 0.6) / 2` from y instead.

##### Labelling Arrows with Text

For every arrow, add a standalone `text` element at its midpoint:

```json
{ "type": "arrow", "id": "a1", "x": 360, "y": 335, "width": 140, "height": 0,
  "points": [[0,0],[140,0]], "endArrowhead": "arrow", "strokeColor": "#1e1e1e", "strokeWidth": 2 },
{ "type": "text", "id": "a1_lbl", "x": 390, "y": 318,
  "text": "SIP/RTP", "fontSize": 14, "strokeColor": "#1e1e1e" }
```

**Arrow label positioning:**
- Horizontal arrow: `text.x = arrow.x + arrow.width/2 - text.length * fontSize * 0.25`, `text.y = arrow.y - fontSize - 4`
- Vertical arrow: `text.x = arrow.x + 8`, `text.y = arrow.y + arrow.height/2 - fontSize/2`

##### Drawing Order — Progressive (CRITICAL for streaming)

Build elements in progressive order — each shape immediately followed by its label and its outgoing arrows:

```
cameraUpdate → zone_bg1 → zone_title1 → shape1 → shape1_text → arrow1 → arrow1_text → shape2 → shape2_text → ... → diagram_title → legend
```

**Do NOT** group all shapes together, then all text, then all arrows. That produces a bad streaming experience.

#### Step 3: Apply Minimum Structure Requirements

Every diagram MUST have ALL of the following — no exceptions:

| Requirement | Rule |
|-------------|------|
| **cameraUpdate** | First element must be a `cameraUpdate` with 4:3 ratio viewport sized to content |
| **Diagram title** | A standalone `text` element, fontSize >= 24, centered over the full diagram |
| **Zone titles** | Every background zone rectangle must have a standalone `text` element 8-12px below its top edge |
| **Node labels** | Every shape must have a paired standalone `text` element — no empty boxes |
| **Arrow labels** | Every arrow must have a standalone `text` element at its midpoint |
| **Arrow direction** | Verify arrow start -> end matches the actual data/call flow described in Phase 2 |

**Conditional zone requirements by diagram type:**
- **Architecture / Network / Topology:** At least 2 distinct zone sections with different colors, at least 3 labelled nodes
- **Flowchart / Sequence / ER / Freeform:** Zones optional, but at least 3 labelled nodes required

#### Step 4: Apply Color Consistency Rules

- Each zone uses **one** color family — do not mix fill colors within a zone
- Use pastel fills for nodes, lower-opacity backgrounds for zones
- If the diagram uses 3 or more colors, add a **legend** positioned at the bottom-right of the diagram content:

```json
{ "type": "rectangle", "id": "legend_bg", "x": MAX_X+40, "y": MAX_Y-120, "width": 180, "height": 120,
  "backgroundColor": "#f8f9fa", "fillStyle": "solid", "strokeColor": "#adb5bd", "strokeWidth": 1,
  "roundness": {"type": 3} },
{ "type": "text", "id": "legend_title", "x": MAX_X+70, "y": MAX_Y-108,
  "text": "Legend", "fontSize": 16, "strokeColor": "#495057" },
{ "type": "rectangle", "id": "legend_c1", "x": MAX_X+56, "y": MAX_Y-82, "width": 16, "height": 16,
  "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeColor": "#4a9eed" },
{ "type": "text", "id": "legend_l1", "x": MAX_X+80, "y": MAX_Y-82,
  "text": "Zone Name", "fontSize": 14, "strokeColor": "#1e1e1e" }
```

Replace `MAX_X` and `MAX_Y` with the rightmost and bottommost coordinates of actual diagram content. Add one swatch + label row per color used.

#### Step 5: Pre-Export Verification — MANDATORY

**Before calling `export_to_excalidraw`, you must complete both parts. Do not skip.**

**Part A — Element Count Summary:**

Count and print the following before proceeding:
```
Verification:
- Shapes (rectangle/ellipse/diamond): N
- Text elements: M
- Arrows: A
- Arrow label texts: L
- Zone backgrounds: Z
- Zone title texts: T
- cameraUpdate: 1 (required)
- Diagram title text: 1 (required)
```

Then verify:
- M >= N (every shape has at least one paired text)
- L >= A (every arrow has a label text)
- T >= Z (every zone has a title text)
- cameraUpdate count = 1 or more
- Diagram title count = 1

**Part B — Quality Checklist:**

- [ ] **cameraUpdate is first element** with 4:3 ratio
- [ ] **Diagram title exists** — `text` element at top, fontSize >= 24
- [ ] **Every zone has a title** — zone bg rectangles paired with `text` elements
- [ ] **Every shape has a text label** — no empty boxes
- [ ] **Every arrow has a text label** — standalone `text` at arrow midpoint
- [ ] **No `label` field used anywhere** — not on shapes, not on arrows
- [ ] **No overlaps** — node elements have >= 20px gap between them
- [ ] **Arrow directions are logical** — match the described data flow
- [ ] **Color consistency** — nodes inside each zone use same color family
- [ ] **Legend present (if 3+ colors)** — positioned relative to content
- [ ] **Zone minimums met** — architecture/network: 2+ zones; others: 3+ nodes

If any item fails: fix the elements array before proceeding.

#### Step 6: Call create_view

Use `mcp-cli call excalidraw/create_view` with the verified elements JSON string.

#### Step 7: Export

Call `mcp-cli call excalidraw/export_to_excalidraw` with the full Excalidraw JSON:
```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "claude-code",
  "elements": [...],
  "appState": {"viewBackgroundColor": "#ffffff"},
  "files": {}
}
```

### Phase 4: Deliver

Present the shareable link and offer iteration:

```
Diagram: [excalidraw.com link]

Components: [count] elements
Type: [diagram type]

Want me to adjust anything? I can:
- Add/remove components
- Change colors or layout
- Add annotations or notes
- Re-export after changes
```

---

## Layout Guidelines

### Spacing Rules
- **Horizontal gap between nodes**: 60-80px
- **Vertical gap between rows**: 80-100px
- **Node width**: 120-180px depending on label length
- **Node height**: 60-84px (single line: 60, with subtitle: 84)
- **Zone padding**: 30px around all contained elements
- **Title**: y=20, centered horizontally over the diagram

### Arrow Positioning
- Arrows start from the right edge of source element
- Arrows end at the left edge of target element
- Arrow `x,y` = source element's right-center
- Arrow `points` = `[[0,0], [gap_width, 0]]` for horizontal
- Arrow `points` = `[[0,0], [0, gap_height]]` for vertical

### Color Strategy
- Use **fills** (pastel backgrounds) for node types
- Use **zone backgrounds** (opacity: 30-40) for logical grouping
- Use **consistent stroke colors** matching the zone theme
- Limit to 3-4 colors per diagram for clarity
- Each zone = one color family (no mixing)

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Using `label` field on shapes | Use standalone `text` elements — `label` does not reliably render |
| Using `label` field on arrows | Use standalone `text` at arrow midpoint — `label` does not render on arrows either |
| Following read_me `label` examples | read_me says "PREFERRED" but it's broken — always use standalone `text` |
| Zone with no title text | Add a `text` element 10px below the zone rectangle's top edge |
| Arrow with no description | Add a `text` element at the arrow's midpoint |
| Text x not centered | Use formula: `shape.x + shape.width/2 - text.length * fontSize * 0.25` |
| Nodes overlapping | Check coordinates before export; leave >= 20px gap |
| 3+ colors with no legend | Add a legend positioned relative to diagram content |
| Arrows in wrong direction | Re-read Phase 2 description and verify start -> end matches flow |
| Missing cameraUpdate | Must be the first element — always include one |
| Grouping all shapes then all text | Use progressive order: shape -> its text -> its arrows -> next shape |

---

## Important Notes

- Always call `mcp-cli info excalidraw/<tool>` before any `mcp-cli call` — schemas may change
- Keep element JSON compact — no comments, no trailing commas
- Every element needs a unique `id` string
- Always export and provide the shareable link — don't just create_view without exporting
- Use multiple `cameraUpdate` elements throughout the array to guide attention while drawing
- At camera sizes XL (1200x900) and above, use fontSize 20+ to maintain readability
