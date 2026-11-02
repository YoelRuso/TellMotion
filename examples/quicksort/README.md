# quicksort (Motion Canvas · TellMotion)

```bash
npm install
npm start        # editor at http://localhost:9000
```

- Theme: `src/theme.ts` (generated). Change it with `node <skill>/tools/apply-theme.mjs <theme> .`
- Global pace and legend: `src/config.ts`
- Scenes: `src/scenes/`, registered in `src/project.ts`
- Render: `npm run render` writes `output/quicksort/quicksort.mp4` without opening the editor (needs Chrome, Edge or Chromium). Options after `npm run render --`: `--format mp4,webm,gif`, `--aspect 9:16,1:1`, `--thumb`, `--draft`, `--info`, `--dry-run` (estimates file sizes)
