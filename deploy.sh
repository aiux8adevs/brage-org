#!/usr/bin/env bash
# Upload site/ to brage.org. Dry run by default; pass --go to upload for real.
# --delete removes files on the server that are no longer in site/.
set -euo pipefail
cd "$(dirname "$0")"
# Video folders are protected from --delete: the videos are not in git (see sync_videos.sh), so a
# checkout without them must not wipe them on the server. Old videos are removed by hand.
flags=(-av --delete --filter "P video/***" --exclude .git -e "ssh -i $HOME/.ssh/obrage_simply -o IdentitiesOnly=yes")
[[ "${1:-}" == "--go" ]] || flags+=(--dry-run)
rsync "${flags[@]}" site/ brage.org@ssh.simply.com:/var/www/brage.org/public_html/
