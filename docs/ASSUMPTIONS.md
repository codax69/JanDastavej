# JanDastavej (PS000221) — Engineering Assumptions

1. **Package Manager**: Switched to npm workspaces (`apps/*`, `packages/*`) per explicit user instruction.
2. **Document Briefs**: `docs/ANTIGRAVITY_FLOWS_AND_THEME.md` was copied from the task brief in `docs/FLOW_AUDIT.md`. `docs/FLOW_AUDIT.md` is reserved for the post-Stage 5 flow audit results.
3. **Database**: Local MongoDB instance running at `mongodb://127.0.0.1:27017/jandastavej`.
4. **Font Hosting**: Both `Noto Sans Gujarati` and `Noto Sans` bundled via `@fontsource` packages locally to guarantee zero external requests for both UI preview and sandboxed Playwright PDF worker.
5. **PDF Sandbox**: Playwright Chromium runs headless without external network egress (`--disable-remote-fonts`, `--disable-background-networking`), loading templates with embedded local CSS and fonts.
6. **Seed Credentials**: Demo admin seeded with email `admin@jandastavej.local` and password `DemoAdminPass123!`.
7. **Demo Label**: All unapproved demo templates prominently carry: "Demo only — not for official use." / "માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી."
