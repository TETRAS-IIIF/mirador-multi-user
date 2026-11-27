type Body = { purpose?: string; value?: unknown };

/**
 * What the assistant flagged as uncertain in an annotation (its W3C
 * "assessing" body, "Uncertain: …"), without the prefix; null when none.
 */
export function uncertainty(
  annotation: Record<string, unknown>,
): string | null {
  const body = annotation.body as Body | Body[] | undefined;
  const bodies = Array.isArray(body) ? body : body ? [body] : [];
  const assessing = bodies.find((b) => b?.purpose === 'assessing');
  if (!assessing) return null;
  const text = String(assessing.value ?? '')
    .replace(/^\s*uncertain\s*:\s*/i, '')
    .trim();
  return text || null;
}
