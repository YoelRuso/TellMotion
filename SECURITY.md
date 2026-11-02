# Security policy

## Scope
TellMotion is a skill: instructions, themes, templates and small Node tools that agents run on a user's machine (scaffolding projects, `npm install`, type-checking). It has no server and collects no data. The website is static.

## Reporting a vulnerability
Please **do not open a public issue** for security problems. Use GitHub's private reporting: **Security → Report a vulnerability** on the repository. Include what you found, how to reproduce it and the potential impact. We aim to acknowledge reports within a few days.

Examples of in-scope issues: a script that deletes or overwrites files outside the project it creates, a command injection through a theme field or project name, an unsafe instruction in `SKILL.md` or `llms.txt` that could make an agent run something harmful, or a dependency/font reference that points to a malicious source.

## Good practice for users
- Read the commands in `llms.txt` before an agent runs them; the install flow asks for your confirmation on purpose.
- Prefer copying the skill (`--copy`) and keep it under version control.
- Review community-contributed themes (JSON files) before applying them; they are data, but check font names and colors.

## Supported versions
Only the latest release receives fixes.
