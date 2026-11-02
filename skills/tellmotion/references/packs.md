# Component packs

Packs add ready-made animated pieces on top of the core (`Box`, `Arrow`, `Packet`, `Piece`, `prepareScene`). Every piece reads the active theme, so it looks right in any theme.

```bash
bash <skill>/scripts/new-project.sh <name> --theme <id> --pack algorithms,charts   # or --pack all
bash <skill>/scripts/new-project.sh <name> --theme <id> --pack all --demos         # also copies one demo scene per pack
```
Each pack lives in `assets/packs/<pack>/` (`*.tsx` components, `pack.json` metadata and dependencies, `demo/` scene). The demo of a pack is the fastest way to see its API in use.

All packs follow the same conventions: constructor `new X(parent, opts)` (positions in scene coordinates), then generator methods (`appear()`, `glow()`, `dim()`, and pack-specific ones) used with `yield*`.

| Pack | Components | Good for |
|---|---|---|
| **cloud** | `Service` (db icon), `Queue` (`push`/`pop`, `dlq`), `Lambda`, `Database` | architectures, pipelines, event flows |
| **algorithms** | `Cell` (`setValue`, `mark`), `Bar` (`moveTo`, `setValue`, `mark`), `Pointer`, `TreeNode` + `link()`, `swap(a, b)` | sorting, searching, arrays, stacks, trees, graphs |
| **charts** | `BarChart` (`prefix`, `suffix`, `decimals`; `grow`, `update`, `highlight`), `LineChart` (`draw`), `PieChart` (`sweep`, `highlight`), `Counter` (`countTo`) | data stories, metrics, comparisons |
| **flowchart** | `Terminator`, `Process`, `Decision`, `DataIO`, `Tag` (Yes/No) | processes, decision trees, procedures |
| **timeline** | `Timeline` (`drawAxis`, `showBands`, `reveal`, `revealAll`, `focus`) | history, roadmaps, project phases |
| **code** | `CodeView` (`focus(from,to)`, `unfocus`, `change`), `Terminal` (`run(cmd, output)`) | programming tutorials, CLI demos |
| **typography** | `KineticTitle` (`reveal`, `emphasize`), `BulletList` (`showAll`, `focus`), `Quote`, `Compare` (`showLeft/Right/Vs`, `emphasize`) | intros, key points, quotes, A vs B |
| **science** | `Cycle` (`show`, `go`, `orbit`), `Layers` (`reveal`, `focus`), `Wave` (`travel`), `Particles` (`drift`) | natural cycles, strata, waves, molecules |

## Notes
- Join pieces with `connect(parent, a, b)` from `Arrow.tsx`; it picks the facing sides and adds elbows. Tree and graph edges use `link()`, created before the nodes so they sit behind.
- `Terminal` wraps long lines and scrolls when it is full.
- `code` adds dependencies (`@lezer/*`, `@codemirror/language`) automatically through `pack.json`; code uses the theme font when it is monospace, otherwise a system monospace font (`MONO` in `config.ts`).
- Line numbers in `CodeView.focus(from, to)` are 0-based and inclusive.
- Keep one idea per scene: show a chart, then hide it (`root().opacity(0)`) before the next element.
- Build your own pack: extend `Piece` (boxed elements) or write a plain class with `root` and generator methods; add `pack.json` and a `demo/` scene.
- Pitfall found while testing: in a `.map()` that renders several siblings that need refs/signals, wrap them in one `<Node>` instead of a fragment.
