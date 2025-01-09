export function serializeToValidUrl(input) {
  const trimmed = input.trim();

  const encoded = encodeURIComponent(trimmed);

  return encoded.replace(/%20/g, '-');
}
