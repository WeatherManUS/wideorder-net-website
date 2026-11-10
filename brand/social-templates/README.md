# Five recurring content templates

| Family | JSON source | Intended composition |
| --- | --- | --- |
| A — The Problem | `problem.json` | Recognizable operational friction, restrained complexity motif, invitation to discuss it |
| B — Before and After | `before-after.json` | Explicitly labeled measured states, muted before, accented after, strong structural divider |
| C — The Insight | `insight.json` | One concise approved statement, generous whitespace, subtle brand identity |
| D — The Case Study | `case-study.json` | Problem → approach → outcome, linked to a factual source record |
| E — The Demonstration | `demonstration.json` | Opening problem, demonstration frame, measured outcome, website CTA |

Examples are drawn from `src/content/home.ts`. Source references are metadata for editors, not visible marketing claims. Run the renderer with `--content <file>` and `--template <family>` to select a family explicitly. Presets map these families to LinkedIn, YouTube, Facebook, Instagram and X; the same content should be re-composed, not mechanically resized.

`--carousel` generates three additional problem/approach/outcome pages using the approved month-end reporting case. The editable SVG/PNG pages can be assembled into an Instagram carousel or exported to a LinkedIn document PDF using an authorized design tool. No platform upload is performed.

Changing example JSON does not change the approved website content. Confirm every new factual claim against the content source or an approved new brief before export.
