## Local instructions

- At the start of a conversation, read `AGENTS.local.md` in the repository root once if it exists, and follow its environment-specific instructions throughout the conversation in addition to this file. Do not check for or read it again on subsequent turns unless the user explicitly asks you to reload it.
- Keep environment-specific prompts in `AGENTS.local.md`, which is excluded from Git. Do not put shared project rules there.

## Pull requests

- Write PR titles and descriptions in Japanese.

## Shared coding rules

Before creating or editing files, read and follow the rules for the applicable file type:

- `.ts` / `.tsx`:
  - [TypeScript imports](.claude/rules/typescript-imports.md)
  - [TypeScript return types](.claude/rules/typescript-return-types.md)
  - [TypeScript constant naming](.claude/rules/typescript-constants.md)
  - For `.tsx`, also follow the [React props rules](.claude/rules/react-props.md).
- Documents under `docs/`:
  - [Documentation writing](.claude/rules/docs-writing.md)

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
