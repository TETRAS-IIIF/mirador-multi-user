#!/usr/bin/env bash
set -euo pipefail

# Pure bash + GNU tools. No git ops. Run at repo root.

# Collect target files
mapfile -d '' FILES < <(find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -print0)

# No files -> exit quietly
((${#FILES[@]})) || exit 0

# Build a reusable sed program for all transforms (GNU sed required)
SED_SCRIPT="$(mktemp)"
cat >"$SED_SCRIPT" <<'SED_EOF'
# 1) Unstable_Grid2 -> Grid2
s|@mui/material/Unstable_Grid2|@mui/material/Grid2|g

# 2) Remove `item` prop from <Grid ...> opening tags (handles multiline and various RHS forms)
s/(<\s*Grid\b[^>]*?)\s+item(\s*=\s*(\{[^}]*\}|"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|[^[:space:]>/]+))?/\1/g

# 3) Remove `item` prop from <Grid2 ...> opening tags
s/(<\s*Grid2\b[^>]*?)\s+item(\s*=\s*(\{[^}]*\}|"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|[^[:space:]>/]+))?/\1/g

# 4) Normalize stray spaces before tag close
s/[[:space:]]+(\/?>)/\1/g

# 5) Legacy prop renames commonly surfacing during upgrade
s/\bjustify=([[:space:]]*\{[^}]*\}|[[:space:]]*"([^"\\]|\\.)*"|[[:space:]]*'([^'\\]|\\.)*')/justifyContent=\1/g
s/\balign=([[:space:]]*\{[^}]*\}|[[:space:]]*"([^"\\]|\\.)*"|[[:space:]]*'([^'\\]|\\.)*')/alignItems=\1/g
SED_EOF

# Process each file with GNU sed in-place, null-separated mode to handle multiline
for f in "${FILES[@]}"; do
  # Use -z to treat file as a single record (multiline regex)
  sed -z -E -i -f "$SED_SCRIPT" "$f"
done

rm -f "$SED_SCRIPT"
echo "Done"
