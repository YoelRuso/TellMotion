#!/usr/bin/env bash
# Usage: new-project.sh <name> [--theme <id|path.json>] [--pack a,b|all] [--demos] [--no-install]
# Creates a Motion Canvas project in the CURRENT directory from the TellMotion template,
# applies a theme, adds component packs and registers the project in .claude/launch.json.
#   --pack   comma-separated packs from assets/packs (cloud, algorithms, charts, flowchart, timeline, code, typography, science) or "all"
#   --demos  also copy each pack's demo scene(s) into src/scenes and register them (handy to see what a pack offers)
set -euo pipefail

NAME="${1:?Project folder name required (lowercase, no spaces)}"; shift
THEME="blueprint"; PACKS=""; INSTALL=1; DEMOS=0
while [ $# -gt 0 ]; do
  case "$1" in
    --theme) THEME="$2"; shift 2 ;;
    --pack) PACKS="$2"; shift 2 ;;
    --demos) DEMOS=1; shift ;;
    --no-install) INSTALL=0; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$(pwd)/$NAME"
[ -e "$DEST" ] && { echo "$DEST already exists (one project per topic: add scenes there)"; exit 1; }

cp -r "$SKILL_DIR/assets/base" "$DEST"
sed -i "s/__NAME__/$NAME/" "$DEST/package.json"
mkdir -p "$DEST/scripts"
cp "$SKILL_DIR/tools/render.mjs" "$DEST/scripts/render.mjs"
printf '{\n  "version": 0,\n  "timeEvents": [],\n  "seed": %d\n}' "$RANDOM" > "$DEST/src/scenes/example.meta"

# ---- packs ----
if [ "$PACKS" = "all" ]; then PACKS="$(ls "$SKILL_DIR/assets/packs" | paste -sd, -)"; fi
DEMO_SCENES=""
if [ -n "$PACKS" ]; then
  IFS=',' read -ra PLIST <<< "$PACKS"
  for P in "${PLIST[@]}"; do
    [ -d "$SKILL_DIR/assets/packs/$P" ] || { echo "Unknown pack: $P (available: $(ls "$SKILL_DIR/assets/packs" | paste -sd, -))"; exit 1; }
    cp "$SKILL_DIR/assets/packs/$P/"*.tsx "$DEST/src/components/"
    node -e '
      const fs=require("fs"); const [pj,pkg]=process.argv.slice(1);
      const deps=JSON.parse(fs.readFileSync(pj,"utf8")).dependencies||{};
      const j=JSON.parse(fs.readFileSync(pkg,"utf8")); Object.assign(j.dependencies,deps);
      j.dependencies=Object.fromEntries(Object.entries(j.dependencies).sort(([a],[b])=>a.localeCompare(b)));
      fs.writeFileSync(pkg,JSON.stringify(j,null,2)+"\n");
    ' "$SKILL_DIR/assets/packs/$P/pack.json" "$DEST/package.json"
    if [ "$DEMOS" = 1 ] && ls "$SKILL_DIR/assets/packs/$P/demo/"*.tsx >/dev/null 2>&1; then
      for F in "$SKILL_DIR/assets/packs/$P/demo/"*.tsx; do
        B="$(basename "$F" .tsx)"
        cp "$F" "$DEST/src/scenes/$B.tsx"
        printf '{\n  "version": 0,\n  "timeEvents": [],\n  "seed": %d\n}' "$RANDOM" > "$DEST/src/scenes/$B.meta"
        DEMO_SCENES="$DEMO_SCENES $B"
      done
    fi
  done
fi

# register demo scenes (they replace the minimal example)
if [ -n "$DEMO_SCENES" ]; then
  node -e '
    const fs=require("fs"); const [dest,...names]=process.argv.slice(1);
    const id=n=>n.replace(/-(\w)/g,(_,c)=>c.toUpperCase());
    const imports=names.map(n=>`import ${id(n)} from "./scenes/${n}?scene";`).join("\n");
    fs.writeFileSync(dest+"/src/project.ts",`import {makeProject} from "@motion-canvas/core";\n\n${imports}\n\n// Playback order of the scenes\nexport default makeProject({\n  scenes: [${names.map(id).join(", ")}],\n});\n`);
  ' "$DEST" $DEMO_SCENES
fi

node "$SKILL_DIR/tools/apply-theme.mjs" "$THEME" "$DEST"

cat > "$DEST/README.md" <<EOF
# $NAME (Motion Canvas · TellMotion)

\`\`\`bash
npm install
npm start        # editor at http://localhost:9000
\`\`\`

- Theme: \`src/theme.ts\` (generated). Change it with \`node <skill>/tools/apply-theme.mjs <theme> .\`
- Global pace and legend: \`src/config.ts\`
- Scenes: \`src/scenes/\`, registered in \`src/project.ts\`
- Render: \`npm run render\` writes \`output/$NAME/$NAME.mp4\` without opening the editor (needs Chrome, Edge or Chromium). Options after \`npm run render --\`: \`--format mp4,webm,gif\`, \`--aspect 9:16,1:1\`, \`--thumb\`, \`--draft\`, \`--info\`, \`--dry-run\` (estimates file sizes)
EOF

LJ="$(pwd)/.claude/launch.json"
mkdir -p "$(pwd)/.claude"
[ -f "$LJ" ] || printf '{\n  "version": "0.0.1",\n  "configurations": []\n}\n' > "$LJ"
node -e '
  const fs=require("fs"); const [f,n]=process.argv.slice(1);
  const j=JSON.parse(fs.readFileSync(f,"utf8"));
  if(!j.configurations.find(c=>c.name===n)) j.configurations.push({name:n,runtimeExecutable:"npm",runtimeArgs:["--prefix",n,"start"],port:9000});
  fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n");
' "$LJ" "$NAME"

[ "$INSTALL" = 1 ] && (cd "$DEST" && npm install --no-audit --no-fund 2>&1 | tail -2)
echo "Project created at $DEST (theme: $THEME${PACKS:+, packs: $PACKS})"
