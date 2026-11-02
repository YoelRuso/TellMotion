// Site-wide settings. Change GITHUB_URL once the repository is public.
export const NAME = 'TellMotion';
export const GITHUB_URL = 'https://github.com/YoelRuso/tellmotion';
export const TAGLINE = 'Turn any idea into a polished 2D explainer animation.';
export const DESCRIPTION =
  'TellMotion is an open-source skill for AI coding agents: describe your idea, pick one of dozens of visual themes (or design your own) and get a ready-to-render Motion Canvas animation.';
export const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap';

// ---- Install commands (derived from GITHUB_URL so they stay in sync) ----
const REPO = GITHUB_URL.replace('https://github.com/', '');
export const REPO_NAME = REPO.split('/')[1];
export const INSTALL_PROMPT = `Install TellMotion for me by reading https://raw.githubusercontent.com/${REPO}/main/llms.txt`;
export const NPX_CMD = `npx -y skills@latest add ${REPO} --skill tellmotion --agent claude-code --global --copy --yes`;
export const CLONE_CMD = `git clone ${GITHUB_URL}.git`;
export const COPY_CMD = `cp -r ${REPO_NAME}/skills/tellmotion ~/.claude/skills/`;
export const DOCTOR_CMD = 'node ~/.claude/skills/tellmotion/tools/doctor.mjs';
