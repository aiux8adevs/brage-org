#!/usr/bin/env bash
# Upload site/ to brage.org. Dry run by default; pass --go to upload for real.
# --delete removes files on the server that are no longer in site/.
# --checksum compares file contents, so a file that only has a new timestamp is not uploaded again.
# publish.rules is a whitelist for learn/: drafts and unapproved media stay local.
set -euo pipefail
cd "$(dirname "$0")"
# Video folders are protected from --delete: the videos are not in git (see sync_videos.sh), so a
# checkout without them must not wipe them on the server. Old videos are removed by hand.
flags=(-av --checksum --delete --filter "P video/***" --filter "merge publish.rules" --exclude .git -e "ssh -i $HOME/.ssh/obrage_simply -o IdentitiesOnly=yes")
[[ "${1:-}" == "--go" ]] || flags+=(--dry-run)
rsync "${flags[@]}" site/ brage.org@ssh.simply.com:/var/www/brage.org/public_html/
