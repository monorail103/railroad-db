import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Check .env.local");
  process.exit(1);
}

const allowedScales = [
  "N",
  "HO",
  "PLARAIL",
  "DECAL",
  "PART_N",
  "PART_HO",
  "OTHER",
] as const;
const allowedSet = new Set<string>(allowedScales);

async function main() {
  const sql = neon(databaseUrl);

  const [{ null_count }] = await sql<
    { null_count: string }
  >`select count(*)::text as null_count from wanted where scale is null`;

  const distinctRows = await sql<{ scale: string }>
    `select distinct scale from wanted where scale is not null order by scale`;
  const distinct = distinctRows.map((r) => r.scale);
  const invalid = distinct.filter((v) => !allowedSet.has(v));

  if (invalid.length > 0) {
    console.error(
      "wanted.scale に enum(item_scale) へ変換できない値が含まれています: " +
        invalid.join(", ") +
        "\n先に UPDATE で値を allowedScales のどれかへ寄せてください。"
    );
    process.exit(2);
  }

  if (null_count !== "0") {
    const updated = await sql<{ updated: string }>
      `update wanted set scale = 'N' where scale is null returning 1 as updated`;
    console.log(`Backfilled wanted.scale NULL -> 'N': ${updated.length} rows`);
  } else {
    console.log("No NULL scale values found; nothing to backfill.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
