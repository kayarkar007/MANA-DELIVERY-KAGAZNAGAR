import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const patterns = [
  { name: "AWS access key", expression: /\b(?:A3T|AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: "private key", expression: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/g },
  { name: "Razorpay live key", expression: /\brzp_live_[A-Za-z0-9]{10,}\b/g },
  { name: "MongoDB URI credentials", expression: /mongodb(?:\+srv)?:\/\/[^:\s/]+:[^@\s]+@/gi },
];

const trackedFiles = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const findings = [];

for (const file of trackedFiles) {
  let stats;
  try {
    stats = statSync(file);
  } catch {
    continue;
  }
  if (!stats.isFile() || stats.size > 1_000_000) continue;

  const content = readFileSync(file, "utf8");
  if (content.includes("\0")) continue;
  const contentForScan = content.replace(
    /\b(?:startsWith|endsWith|indexOf)\(\s*["']-----+(?:BEGIN|END)[^"']+["']\s*\)/g,
    ""
  );

  for (const { name, expression } of patterns) {
    expression.lastIndex = 0;
    if (expression.test(contentForScan)) findings.push({ file, name });
  }
}

if (findings.length > 0) {
  console.error("Potential secrets found. Remove them before committing:");
  findings.forEach(({ file, name }) => console.error(`- ${name}: ${file}`));
  process.exit(1);
}

console.log(`Secret scan passed for ${trackedFiles.length} tracked and untracked files.`);
