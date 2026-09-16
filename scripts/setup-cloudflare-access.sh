#!/usr/bin/env bash
#
# setup-cloudflare-access.sh — one-time cutover of the exhibit from a public
# GitHub Pages site to Cloudflare Pages behind Cloudflare Access.
#
# Run it once from the repo root:   bash scripts/setup-cloudflare-access.sh
#
# It walks you through the dashboard work only you can do (DNS, Zero Trust,
# API token), captures the values CI needs, writes them to .env.local, sets the
# GitHub secrets the deploy workflow reads, then verifies that a raw asset URL
# is actually blocked. No step is skipped and nothing irreversible happens
# without an explicit confirmation.
#
# Values captured:
#   CF_DOMAIN              → .env.local                     (the exhibit's domain)
#   CF_PAGES_PROJECT       → .env.local                     (Pages project name)
#   CLOUDFLARE_ACCOUNT_ID  → .env.local + GitHub secret
#   CLOUDFLARE_API_TOKEN   → .env.local + GitHub secret     (secret input)

set -euo pipefail

TOTAL_STAGES=9
ENV_FILE=".env.local"
CF_PAGES_PROJECT="sumaiya-exhibition"
PUBLISHER_REPO="soldiers1234583/sumaiya-site"

# ─────────────────────────────────────────────────────────────────────────────
# Library
# ─────────────────────────────────────────────────────────────────────────────

if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
  CYAN=$'\033[36m'; RED=$'\033[31m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; GREEN=''; YELLOW=''; CYAN=''; RED=''; RESET=''
fi

stage() {
  local n="$1" title="$2"
  [ -t 1 ] && clear 2>/dev/null || printf '\n\n'
  printf '%s\n' "${BOLD}╭──────────────────────────────────────────────────────────────╮${RESET}"
  printf '%s\n' "${BOLD}│  Stage ${n}/${TOTAL_STAGES} · ${title}${RESET}"
  printf '%s\n\n' "${BOLD}╰──────────────────────────────────────────────────────────────╯${RESET}"
}

say()   { printf '%s\n' "$*"; }
step()  { printf '%s\n' "  ${CYAN}▸${RESET} $*"; }
note()  { printf '%s\n' "  ${DIM}$*${RESET}"; }
warn()  { printf '%s\n' "  ${YELLOW}!${RESET} $*"; }
ok()    { printf '%s\n' "  ${GREEN}✓${RESET} $*"; }

progress() {
  printf '\n%s\n' "${DIM}── stage $1/$TOTAL_STAGES done ─────────────────────────────────${RESET}"
}

open_url() {
  local url="$1"
  step "Opening ${CYAN}${url}${RESET}"
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1 &
  elif command -v wslview >/dev/null 2>&1; then wslview "$url" >/dev/null 2>&1 &
  else note "(no browser launcher found — open it yourself)"; fi
  sleep 1
}

ask() {
  local __var="$1" prompt="$2" value=''
  while [ -z "$value" ]; do
    printf '%s' "  ${BOLD}${prompt}${RESET} " >&2
    read -r value || true
    [ -z "$value" ] && warn "A value is required — try again." >&2
  done
  printf -v "$__var" '%s' "$value"
}

ask_secret() {
  local __var="$1" prompt="$2" value=''
  while [ -z "$value" ]; do
    printf '%s' "  ${BOLD}${prompt}${RESET} " >&2
    read -rs value || true
    printf '\n' >&2
    [ -z "$value" ] && warn "A value is required — try again." >&2
  done
  note "captured ${#value} characters (not echoed)" >&2
  printf -v "$__var" '%s' "$value"
}

confirm() {
  local prompt="$1" reply=''
  printf '%s' "  ${YELLOW}${prompt}${RESET} [y/N] " >&2
  read -r reply || true
  case "$reply" in [yY] | [yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

pause() {
  printf '%s' "  ${DIM}Press Enter when that's done…${RESET}" >&2
  read -r _ || true
}

write_env() {
  local key="$1" value="$2" tmp
  local escaped="${value//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  escaped="${escaped//\$/\\\$}"
  [ -f "$ENV_FILE" ] || printf '# Local only — gitignored. Created by scripts/setup-cloudflare-access.sh\n' > "$ENV_FILE"
  tmp="$(mktemp)"
  grep -v "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s="%s"\n' "$key" "$escaped" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  ok "wrote ${key} to ${ENV_FILE}"
}

set_secret() {
  local name="$1" value="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if gh secret set "$name" --body "$value" >/dev/null 2>&1; then
      ok "set GitHub secret ${name}"
      return 0
    fi
    warn "gh could not set ${name} (no repo access from here?)"
  else
    warn "gh CLI not available or not logged in — setting secrets is manual"
  fi
  note "Add it yourself: GitHub → Settings → Secrets and variables → Actions"
  note "  name: ${name}   (value: ${DIM}cat ${ENV_FILE}${RESET} → ${name})"
  return 1
}

PENDING_MANUAL=0

# ─────────────────────────────────────────────────────────────────────────────
# Stages
# ─────────────────────────────────────────────────────────────────────────────

stage 1 "Preflight"
say "This migrates the exhibit off public GitHub Pages onto Cloudflare Pages"
say "behind Cloudflare Access. At the end, an unauthenticated visitor — and"
say "anyone guessing an image or audio URL — gets an Access login page instead."
say ""
step "You need: this domain's registrar login, a Cloudflare account (free), and"
note "a GitHub account with access to this repo."
say ""
if [ -f "$ENV_FILE" ]; then
  note "$ENV_FILE exists — captured values are upserted, not duplicated."
fi
if ! command -v gh >/dev/null 2>&1; then
  warn "gh CLI missing: you'll add the two GitHub secrets by hand (I'll show how)."
fi
say ""
confirm "Ready to start?" || { say "Stopped — nothing was changed."; exit 0; }
progress 1

stage 2 "Point your domain at Cloudflare"
say "Cloudflare Access can only gate a hostname in your own Cloudflare zone, so"
say "the domain has to live in Cloudflare DNS first."
say ""
open_url "https://dash.cloudflare.com/"
step "Sign in / sign up, then choose ${BOLD}Add a site${RESET} and enter your domain."
step "Pick the ${BOLD}Free${RESET} plan."
step "Cloudflare shows you two nameservers. At your registrar, replace the"
note "existing nameservers with those two, then come back here."
step "Wait for the dashboard to show the zone as ${BOLD}Active${RESET}."
note "Propagation is usually minutes; it can take a few hours."
say ""
pause
progress 2

stage 3 "Create the Pages project"
say "The deploy workflow pushes prebuilt assets with wrangler, which needs the"
say "project to already exist."
say ""
open_url "https://dash.cloudflare.com/"
step "Go to ${BOLD}Workers & Pages${RESET} → ${BOLD}Create${RESET} → ${BOLD}Pages${RESET} → ${BOLD}Upload assets${RESET}."
step "Name the project exactly: ${BOLD}${CF_PAGES_PROJECT}${RESET}"
step "For the first upload, drop in any placeholder ${BOLD}index.html${RESET} — the"
note "dashboard refuses an empty upload, and the next deploy overwrites it."
step "Finish, but ${BOLD}do not${RESET} attach a Git integration: CI deploys instead."
say ""
pause
progress 3

stage 4 "Attach your domain to the project"
step "In the project: ${BOLD}Custom domains${RESET} → ${BOLD}Set up a custom domain${RESET}."
step "Enter the domain the exhibit should live on."
note "If it's a subdomain, Cloudflare will create the CNAME for you."
step "Wait until the custom domain shows ${BOLD}Active${RESET} (needs a valid TLS cert)."
say ""
ask CF_DOMAIN "Exhibit domain (no https://, e.g. exhibit.example.com):"
CF_DOMAIN="${CF_DOMAIN%/}"
CF_DOMAIN="${CF_DOMAIN#https://}"
CF_DOMAIN="${CF_DOMAIN#http://}"
write_env "CF_DOMAIN" "$CF_DOMAIN"
write_env "CF_PAGES_PROJECT" "$CF_PAGES_PROJECT"
say ""
note "Check it resolves:  curl -sI https://${CF_DOMAIN}/ | head -1"
pause
progress 4

stage 5 "Put an Access policy in front of it"
say "This is the part that actually makes the exhibit private: every request to"
say "the domain is authenticated ${BOLD}before${RESET} Cloudflare serves anything."
say ""
open_url "https://one.dash.cloudflare.com/"
step "First visit only: pick a team name to create the Zero Trust org."
step "${BOLD}Access${RESET} → ${BOLD}Applications${RESET} → ${BOLD}Add an application${RESET} → ${BOLD}Self-hosted${RESET}."
step "Application domain: ${BOLD}${CF_DOMAIN}${RESET} — and include every"
note "subpath, so a bare asset URL is caught too (leaving the path empty does this)."
step "Policy: Action ${BOLD}Allow${RESET}, Include → ${BOLD}Emails${RESET} → the addresses"
note "allowed to see the exhibit (anyone else is refused outright)."
step "Save, then check ${BOLD}Settings → Authentication → Login methods${RESET}:"
note "One-time PIN should be enabled — that's the emailed-code login."
say ""
warn "Verified at stage 8: an allowed email must reach the page, and an"
warn "unknown visitor must not."
say ""
pause
progress 5

stage 6 "Capture the API token + account ID"
say "The deploy workflow needs a token scoped to Pages only."
say ""
open_url "https://dash.cloudflare.com/profile/api-tokens"
step "${BOLD}Create Token${RESET} → ${BOLD}Create Custom Token${RESET}."
step "Permissions: ${BOLD}Account${RESET} · ${BOLD}Cloudflare Pages${RESET} · ${BOLD}Edit${RESET}"
step "Account Resources: include your account. Set an expiry you're happy with."
step "Create, then copy the token (shown once)."
say ""
ask_secret CLOUDFLARE_API_TOKEN "CLOUDFLARE_API_TOKEN (input hidden):"
say ""
step "Now the account ID."
note "Dashboard → Workers & Pages → right sidebar → Account ID."
ask CLOUDFLARE_ACCOUNT_ID "CLOUDFLARE_ACCOUNT_ID:"
say ""
write_env "CLOUDFLARE_API_TOKEN" "$CLOUDFLARE_API_TOKEN"
write_env "CLOUDFLARE_ACCOUNT_ID" "$CLOUDFLARE_ACCOUNT_ID"
say ""
say "These two are exactly what ${BOLD}.github/workflows/publish-cloudflare.yml${RESET} reads:"
step "secrets.CLOUDFLARE_API_TOKEN"
step "secrets.CLOUDFLARE_ACCOUNT_ID"
set_secret "CLOUDFLARE_API_TOKEN" "$CLOUDFLARE_API_TOKEN" || PENDING_MANUAL=1
set_secret "CLOUDFLARE_ACCOUNT_ID" "$CLOUDFLARE_ACCOUNT_ID" || PENDING_MANUAL=1
say ""
note "${ENV_FILE} is gitignored (.gitignore has .env*) — it is not committed."
progress 6

stage 7 "Deploy"
if [ "$PENDING_MANUAL" -eq 1 ]; then
  warn "Add the two secrets above to GitHub Actions before deploying, or the"
  warn "workflow will fail on an empty token."
  say ""
fi
say "Any push to main now deploys to Cloudflare Pages. Trigger it once by hand:"
step "Actions → ${BOLD}Build & deploy to Cloudflare Pages${RESET} → ${BOLD}Run workflow${RESET}"
note "or, with gh:  gh workflow run publish-cloudflare.yml"
say ""
note "The build stages only the static payload and asserts that index.html,"
note "404.html and the passcode gate are present before it deploys."
pause
progress 7

stage 8 "Verify the door is actually locked"
say "Open a private/incognito window — no session, no cached Access cookie."
say ""
step "1. Visit ${BOLD}https://${CF_DOMAIN}/images/her-pic.webp${RESET}"
note "   Expect: the Cloudflare Access login page, NOT a photo."
step "2. Visit ${BOLD}https://${CF_DOMAIN}/audio/505.flac${RESET}"
note "   Expect: the same login page, not audio bytes."
step "3. Visit ${BOLD}https://${CF_DOMAIN}/${RESET} and log in with an allowed email."
note "   Expect: the email code, then the exhibit — including the passcode gate."
step "4. From a disallowed email or a logged-out browser, confirm you're refused."
say ""
if confirm "Did every check pass?"; then
  ok "Access control is live."
else
  warn "Don't treat the exhibit as private yet."
  note "Usual causes: the Access app is scoped to a subpath instead of the whole"
  note "hostname, DNS isn't proxied (grey cloud), or the policy includes a wider"
  note "group than intended."
fi
progress 8

stage 9 "Delete the old public copy"
say "Until this is gone, none of the above matters: the previous publish is still"
say "sitting in the public repo ${BOLD}${PUBLISHER_REPO}${RESET}, where the HTML and every"
say "image and audio file are readable by anyone who finds it."
say ""
warn "Deleting a remote repo is irreversible. It is not this repo — it is the"
warn "public Vercel/Pages-free mirror that receives the built site."
say ""
step "Preview what's there first:"
note "  gh repo view ${PUBLISHER_REPO}"
note "  gh repo delete ${PUBLISHER_REPO} --yes"
say ""
if confirm "Delete ${PUBLISHER_REPO} now?"; then
  if command -v gh >/dev/null 2>&1; then
    if gh repo delete "$PUBLISHER_REPO" --yes; then
      ok "public copy deleted"
    else
      warn "gh could not delete it — do it in the GitHub UI (steps below)."
    fi
  else
    warn "gh not available — delete it in the GitHub UI:"
    note "Settings → General → Danger Zone → Delete this repository"
  fi
else
  warn "Left in place. The exhibit is NOT private while it lives there."
  note "A narrower option: delete just the gh-pages branch in that repo."
fi
progress 9

printf '\n%s\n' "${BOLD}Done.${RESET}"
say ""
say "Summary:"
ok "passcode gate: session-persistent (PERSIST = true), passcode unchanged"
ok "production deploys to Cloudflare Pages via publish-cloudflare.yml"
ok "public GitHub Pages publish is manual-only and marked deprecated"
note "local dev (npm run serve / server.py) is unaffected and unprotected —"
note "that's expected; it only listens on your machine."
say ""
say "Remaining manual items:"
step "rotate the passcode if it was ever shared in a link or screenshot"
step "keep ${ENV_FILE} out of any backup you share"
