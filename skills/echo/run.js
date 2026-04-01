const raw = process.argv[2] ?? "{}";
let parsed = {};
try {
  parsed = JSON.parse(raw);
} catch {
  parsed = { raw };
}
process.stdout.write(JSON.stringify({ ok: true, echo: parsed }));
