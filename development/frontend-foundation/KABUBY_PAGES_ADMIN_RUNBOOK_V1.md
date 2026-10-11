# Cloudflare Pages administrator runbook V1

This runbook describes the remaining administrative work. It is not evidence
that the settings have already been changed.

1. In **Cloudflare Dashboard → Workers & Pages → Pages**, open the Kabuby Pages
   project and select **Settings → Builds & deployments → Git integration**.
   Confirm the connected GitHub repository is `luisfonse2010-cell/shatokb-theme`
   and record the production branch and current production deployment ID.
2. In **Settings → Builds & deployments**, verify the production branch is the
   approved default release branch. Do not configure a branch named
   `codex/kabuby-com-foundation` as production.
3. In **Deployments**, open the deployment generated from the reviewed pull
   request/immutable commit and use **View preview**. Record its deployment ID,
   commit SHA, preview URL, and the successful Kabuby foundation CI URL.
4. Validate the preview: unauthenticated physical projection handling must be
   safe; the established Scout navigation and Chrome-extension flow must remain
   unchanged; no legacy client-side provider credential flow may be present.
5. In **GitHub → repository Settings → Rules/Branches**, require the Kabuby
   foundation CI and Scout protection checks before merging the production
   branch. Keep the Actions Pages workflow certification-only; it must not
   deploy Pages.
6. After an explicit release review, return to **Cloudflare Pages → Deployments**,
   select the recorded preview/source deployment and choose the UI action
   labelled **Promote** or **Rollback to this deployment** (label varies by
   account plan). Confirm the exact immutable commit shown in the dialog before
   accepting it.
7. After promotion, record the production deployment ID, commit SHA, public
   content hash, promotion time, and Scout verification in
   `KABUBY_PAGES_RELEASE_GOVERNANCE_V1.json`. If validation fails, use the same
   Deployments view to select the recorded known-good deployment and promote it
   back; record the rollback.

Expected state: one Git-connected Pages project, reviewed previews, explicit
production promotion, no direct GitHub Actions deployment, and an immutable
known-good deployment record.
