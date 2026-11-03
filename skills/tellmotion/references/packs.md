# Component packs

Packs add ready-made animated pieces on top of the core (`Box`, `Arrow`, `Packet`, `Piece`, `prepareScene`). Every piece reads the active theme, so it looks right in any theme.

```bash
bash <skill>/scripts/new-project.sh <name> --theme <id> --pack algorithms,charts   # or --pack all
bash <skill>/scripts/new-project.sh <name> --theme <id> --pack all --demos         # also copies one demo scene per pack
```
Each pack lives in `assets/packs/<pack>/` (`*.tsx` components, `pack.json` metadata and dependencies, `demo/` scene). The demo of a pack is the fastest way to see its API in use.

All packs follow the same conventions: constructor `new X(parent, opts)` (positions in scene coordinates), then generator methods used with `yield*`. Every piece has `appear()`, `glow(on)`, `ping()`, `dim(on)` and `hide()`; pieces with a box and a label also have `mark(color, solid)` and `unmark()`. The table lists what each one adds. `appear()` shows the whole element, also when it is built from several parts; use its specific methods (`reveal`, `showAll`, `drawAxis`...) to control the steps.

Labels wrap inside their piece, and shrink if they still do not fit; a shrunk label goes below the 28 px minimum, so shorten it or widen the piece. Text with its own `\n` keeps those line breaks.

| Pack | Components | Good for |
|---|---|---|
| **cloud** | `Client` (`device`: web, mobile, user), `Gateway`, `Service` (db icon), `Cache` (`hit`, `miss`), `EventBus` (`from`, `to`, `publish`), `Queue` (`push`/`pop`, `dlq`), `Lambda`, `Database` | architectures, pipelines, event flows |
| **algorithms** | `Cell` (`setValue`), `Bar` (`moveTo`, `setValue`, `mark`), `Pointer`, `Tree` (from data; `visit`, `clearMarks`), `TreeNode` + `link()` (graphs), `swap(a, b)` | sorting, searching, arrays, stacks, trees, graphs |
| **charts** | `BarChart` (`grow`, `update`, `highlight`), `LineChart` (`series`; `draw`, `highlight`, `highlightLine`), `PieChart` (`sweep`, `highlight`), `Counter` (`countTo`). `BarChart` and `LineChart` take `ticks`, `prefix`, `suffix` and `decimals` | data stories, metrics, comparisons |
| **flowchart** | `Terminator`, `Process`, `Decision`, `DataIO`, `Tag` (Yes/No) | processes, decision trees, procedures |
| **timeline** | `Timeline` (`drawAxis`, `showBands`, `reveal`, `revealAll`, `focus`) | history, roadmaps, project phases |
| **code** | `CodeView` (`focus(from,to)`, `unfocus`, `change`), `Terminal` (`run(cmd, output)`) | programming tutorials, CLI demos |
| **typography** | `KineticTitle` (`reveal`, `emphasize`), `BulletList` (`showAll`, `focus`), `Quote`, `Compare` (`showLeft/Right/Vs`, `emphasize`) | intros, key points, quotes, A vs B |
| **science** | `Cycle` (`show`, `go`, `orbit`), `Layers` (`reveal`, `focus`), `Wave` (`travel`), `Particles` (`drift`) | natural cycles, strata, waves, molecules |

## Notes
- Join pieces with `connect(parent, a, b)` from `Arrow.tsx`; it picks the facing sides and adds elbows. Tree and graph edges use `link()`, created before the nodes so they sit behind.
- `Terminal` wraps long lines and scrolls when it is full.
- `EventBus.publish(producer, [consumers], {name})` plays a whole event; `bus.from(piece)` and `bus.to(piece)` draw the arrows.
- `ticks` draws the value labels to the left of the plot: leave about 120 px there. The top of the scale rounds up unless you set `max`.
- `Timeline` moves labels that would collide to the other side or up to three heights; keep it near the vertical center, and leave a few milestones per stretch: past that they overlap.
- `code` adds dependencies (`@lezer/*`, `@codemirror/language`) automatically through `pack.json`; code uses the theme font when it is monospace, otherwise a system monospace font (`MONO` in `config.ts`).
- Line numbers in `CodeView.focus(from, to)` are 0-based and inclusive.
- Keep one idea per scene: show a chart, then `hide()` it before the next element.
- Build your own pack: extend `Piece` (boxed elements) or `Group` (anything else), both in `Piece.tsx`; add `pack.json` and a `demo/` scene.
- Pitfall found while testing: in a `.map()` that renders several siblings that need refs/signals, wrap them in one `<Node>` instead of a fragment.
