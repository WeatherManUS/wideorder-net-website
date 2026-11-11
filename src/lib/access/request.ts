export async function boundedAdminForm(request: Request) {
  const type = request.headers.get("content-type") || "";
  if (!type.startsWith("application/x-www-form-urlencoded") || Number(request.headers.get("content-length") || 0) > 65536) throw new Error("invalid_request");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_request");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const next = await reader.read(); if (next.done) break; length += next.value.byteLength; if (length > 65536) { await reader.cancel(); throw new Error("invalid_request"); } chunks.push(next.value); }
  const form = new FormData();
  for (const [key, value] of new URLSearchParams(Buffer.concat(chunks).toString("utf8"))) form.append(key, value);
  return form;
}
