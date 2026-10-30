#!/usr/bin/env bash
# Upload site/ to brage.org. Dry run by default; pass --go to upload for real.
# --delete removes files on the server that are no longer in site/.
set -euo pipefail
cd "$(dirname "$0")"
flags=(-av --delete --exclude .git -e "ssh -i $HOME/.ssh/obrage_simply -o IdentitiesOnly=yes")
[[ "${1:-}" == "--go" ]] || flags+=(--dry-run)
rsync "${flags[@]}" site/ brage.org@ssh.simply.com:/var/www/brage.org/public_html/
