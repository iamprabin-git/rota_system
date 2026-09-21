import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function upsertEnv(file: string, key: string, value: string) {
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  const lines = text.split(/\r?\n/);
  const prefix = `${key}=`;
  const next = lines.some((line) => line.startsWith(prefix))
    ? lines.map((line) => (line.startsWith(prefix) ? `${prefix}${value}` : line))
    : [...(text.endsWith("\n") || !text ? lines : [...lines, ""]), `${prefix}${value}`];
  writeFileSync(file, next.join("\n").replace(/\n+$/, "\n"));
}

async function main() {
  loadEnv(".env.local");

  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    throw new Error("DATABASE_URL is missing. Run: npx neon claim create --env-pull --file .env.local");
  }

  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
    upsertEnv(".env.local", "POSTGRES_URL", process.env.DATABASE_URL);
  }

  if (!process.env.AUTH_SECRET) {
    const secret = randomBytes(32).toString("base64url");
    process.env.AUTH_SECRET = secret;
    upsertEnv(".env.local", "AUTH_SECRET", secret);
  }

  const { ready, listCompanies, listUsers, listEmployees, listPayslips } = await import("../src/lib/db-pg");
  await ready();
  const [companies, users, people, payslips] = await Promise.all([
    listCompanies(),
    listUsers(),
    listEmployees(),
    listPayslips(),
  ]);

  console.log(
    `Neon Postgres ready: ${companies.length} companies, ${users.length} users, ${people.length} people, ${payslips.length} payslips.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
