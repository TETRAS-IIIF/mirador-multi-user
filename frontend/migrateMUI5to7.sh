#!/usr/bin/env bash
# Fast MUI Grid v2 fixer with progress + parallelism (pure bash + GNU tools).
# Usage: JOBS=8 QUIET=0 DRY_RUN=0 bash mui_grid2_fix.sh

set -euo pipefail
: "${JOBS:=$(command -v nproc >/dev/null 2>&1 && nproc || echo 4)}"
: "${QUIET:=0}"     # 1 = only summary; 0 = per-file ticks
: "${DRY_RUN:=0}"   # 1 = print filenames only

# Preconditions
command -v sed >/dev/null || { echo "sed not found"; exit 1; }
sed --version 2>&1 | grep -qi gnu || { echo "GNU sed required"; exit 1; }

# Files
mapfile -d '' FILES < <(find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -print0)
TOTAL=${#FILES[@]}
(( TOTAL > 0 )) || { echo "0 files"; exit 0; }

# Transform program
SED_SCRIPT="$(mktemp)"
cat >"$SED_SCRIPT" <<'SED_EOF'
s|@mui/material/Unstable_Grid2|@mui/material/Grid2|g
s/(<\s*Grid\b[^>]*?)\s+item(\s*=\s*(\{[^}]*\}|"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|[^[:space:]>/]+))?/\1/g
s/(<\s*Grid2\b[^>]*?)\s+item(\s*=\s*(\{[^}]*\}|"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|[^[:space:]>/]+))?/\1/g
s/(<\s*Grid\b[^>]*\bcontainer\b[^>]*?)\s+xs\s*=\s*(\{[^}]*\}|[^[:space:]>/]+)/\1 columns=\2/g
s/(<\s*Grid2\b[^>]*\bcontainer\b[^>]*?)\s+xs\s*=\s*(\{[^}]*\}|[^[:space:]>/]+)/\1 columns=\2/g
s/\bjustify=([[:space:]]*\{[^}]*\}|[[:space:]]*"([^"\\]|\\.)*"|[[:space:]]*'([^'\\]|\\.)*')/justifyContent=\1/g
s/\balign=([[:space:]]*\{[^}]*\}|[[:space:]]*"([^"\\]|\\.)*"|[[:space:]]*'([^'\\]|\\.)*')/alignItems=\1/g
s/[[:space:]]+(\/?>)/\1/g
SED_EOF

# Worker
process_file() {
  local f="$1"
  if (( DRY_RUN == 1 )); then
    printf '%s\0' "$f"
  else
    sed -z -E -i -f "$SED_SCRIPT" "$f"
    (( QUIET == 1 )) || printf '✓ %s\n' "$f"
  fi
}

export -f process_file
export SED_SCRIPT DRY_RUN QUIET

# Timing
START_EPOCH=$(date +%s)

# Parallel run
printf 'Files: %d  Jobs: %d\n' "$TOTAL" "$JOBS"
printf 'Running...\n'

# Feed files to xargs in parallel
printf '%s\0' "${FILES[@]}" | xargs -0 -n1 -P "$JOBS" bash -c 'process_file "$@"' _

DUR=$(( $(date +%s) - START_EPOCH ))

# Summary
if (( DRY_RUN == 1 )); then
  echo
  echo "Dry-run complete. (No files modified)"
else
  echo
  echo "Complete."
fi
echo "Processed: $TOTAL files in ${DUR}s"

rm -f "$SED_SCRIPT"
