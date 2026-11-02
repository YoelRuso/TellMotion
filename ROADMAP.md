# Roadmap

Plans can change. Ideas and votes are welcome in [issues](https://github.com/YoelRuso/TellMotion/issues).

## Now
- [ ] **Try the storyboard and recipes flow with more agents and requests** (one DNS video so far), and adjust `SKILL.md` to what happens
- [ ] Test `npm run render` on macOS and Linux, and with Edge
- [ ] Check the recipes in the themes not covered yet (`npm run sheets`)
- [ ] **Keep growing the theme catalog** (gaps: more neon, light and corporate looks; community themes welcome)
- [ ] **Example videos** in different domains (Git branches, water cycle, quicksort) with real renders on the website
- [ ] Verify the full `npx skills add` install per agent (discovery with `--list` is confirmed) and document install locations

## Next
- [ ] Test the optional Figma helper end to end
- [ ] Theme submission flow: issue template → PR with preview comment
- [ ] Spanish site translation
- [ ] More packs (maps, math/formulas, UI mockups)
- [ ] Native vertical and square layouts in the recipes (today the video is fitted with bars)
- [ ] Theme editor on the website
- [ ] `tellmotion check`: automatic warnings about cut-off text, low contrast and dense scenes

## Later
- [ ] Packaging as an installable plugin
- [ ] Narration, subtitles (SRT) and audio sync in the template
- [ ] User branding: logo, colors and font to a theme with branded intro and outro
- [ ] Community theme packages

## Done
- [x] Theme format, preview generator and `apply-theme`
- [x] 24 themes, 8 component packs, generic template
- [x] Website with live demo and gallery
- [x] `llms.txt`, `doctor`, tests and CI
- [x] Render command: mp4, WebM, GIF, thumbnails, vertical and square, size estimates
- [x] Scene recipes: intro, chapter, compare, before/after, steps, outro
- [x] Storyboard to approve before animating
