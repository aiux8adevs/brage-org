#!/usr/bin/env bash
# Upload site/ to brage.org. Dry run by default; pass --go to upload for real.
# --delete removes files on the server that are no longer in site/.
# --checksum compares file contents, so a file that only has a new timestamp is not uploaded again.
# publish.rules is a whitelist for learn/: drafts and unapproved media stay local.
set -euo pipefail
cd "$(dirname "$0")"

# Staging guard: every folder in staged.list must carry a .htaccess that asks for the password,
# otherwise a preview would go online unprotected. Abort before anything is uploaded.
staged=()
while read -r dir; do
  [[ -z "$dir" || "$dir" == \#* ]] && continue                     # skip blank lines and comments
  staged+=("$dir")
  if ! grep -q "Require valid-user" "site/$dir/.htaccess" 2>/dev/null; then
    echo "STOP: site/$dir is in staged.list but has no protecting .htaccess. Nothing uploaded." >&2
    exit 1
  fi
done < staged.list

# The self-tests: every question must still point to a line in its video and a task in its simulator, and none may
# rest on narration or a task that has changed since it was written (selftest/selftest.py says what to do).
if ! python3 selftest/selftest.py check; then
  echo "STOP: the self-tests do not match the videos or the simulators. Nothing uploaded." >&2
  exit 1
fi

# Video folders are protected from --delete: the videos are not in git (see sync_videos.sh), so a
# checkout without them must not wipe them on the server. Old videos are removed by hand.
flags=(-av --checksum --delete --filter "P video/***" --filter "merge publish.rules" --exclude .git -e "ssh -i $HOME/.ssh/obrage_simply -o IdentitiesOnly=yes")
[[ "${1:-}" == "--go" ]] || flags+=(--dry-run)
rsync "${flags[@]}" site/ brage.org@ssh.simply.com:/var/www/brage.org/public_html/

# After a real upload: each staged folder must answer 401 (password required) to a visitor without it.
if [[ "${1:-}" == "--go" ]]; then
  for dir in "${staged[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "https://brage.org/$dir/")
    if [[ "$code" == "401" ]]; then echo "staging ok: /$dir/ asks for the password (401)"
    else echo "WARNING: /$dir/ answered $code, not 401. It may be public. Check it now." >&2; fi
  done
fi
