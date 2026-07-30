/**
 * compress-assets.mjs
 * ─────────────────────────────────────────────────────
 * One-shot script to compress oversized public assets.
 * Run with:  node scripts/compress-assets.mjs
 *
 * Requires: sharp   (installed by npm install --save-dev sharp)
 */

import sharp from "sharp";
import { existsSync, copyFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const PUBLIC = resolve("public");

const tasks = [
    {
        // favicon.ico is 7 MB — replace with a tiny 32x32 ICO-formatted PNG
        // (browsers accept .ico files that are actually PNG data)
        input: `${PUBLIC}/logo2.png`,
        output: `${PUBLIC}/favicon.ico`,
        options: { width: 32, height: 32, fit: "cover" },
        format: "png",
        quality: 85,
        label: "favicon.ico (32x32 PNG-as-ICO)",
    },
    {
        // logo2.png is 7 MB — compress to ≤ 50 KB WebP for use in app
        // sharp cannot read and write to the same file, so we use a temp path
        input: `${PUBLIC}/logo2.png`,
        output: `${PUBLIC}/logo2_tmp_compressed.png`,
        finalPath: `${PUBLIC}/logo2.png`,
        options: { width: 200, height: 200, fit: "cover" },
        format: "png",
        quality: 80,
        label: "logo2.png (200x200 compressed PNG)",
    },
    {
        // og-image.png is 5.5 MB — convert to WebP ≤ 200 KB
        input: `${PUBLIC}/og-image.png`,
        output: `${PUBLIC}/og-image.webp`,
        options: { width: 1200, height: 630, fit: "cover" },
        format: "webp",
        quality: 80,
        label: "og-image.webp (1200x630 WebP)",
    },
];

function fmtSize(bytes) {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
    return `${(bytes / 1000).toFixed(1)} KB`;
}

for (const task of tasks) {
    if (!existsSync(task.input)) {
        console.warn(`⚠  Skipping ${task.label} — input not found: ${task.input}`);
        continue;
    }

    const beforeSize = statSync(task.input).size;

    // Back up original if writing to same path
    const isSamePath = task.input === task.output;
    const backup = isSamePath ? `${task.input}.bak` : null;
    if (isSamePath) copyFileSync(task.input, backup);

    try {
        let pipeline = sharp(task.input).resize(task.options);

        if (task.format === "webp") {
            pipeline = pipeline.webp({ quality: task.quality });
        } else if (task.format === "png") {
            pipeline = pipeline.png({ quality: task.quality, compressionLevel: 9 });
        } else if (task.format === "jpeg") {
            pipeline = pipeline.jpeg({ quality: task.quality });
        }

        await pipeline.toFile(task.output);

        const afterSize = statSync(task.output).size;
        const saving = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1);

        // If a final path is specified (temp-then-rename pattern), rename now
        if (task.finalPath && task.finalPath !== task.output) {
            const { renameSync } = await import("node:fs");
            renameSync(task.output, task.finalPath);
        }

        console.log(`✅  ${task.label}`);
        console.log(`    ${fmtSize(beforeSize)} → ${fmtSize(afterSize)}  (saved ${saving}%)\n`);

        // Remove backup if succeeded
        if (backup && existsSync(backup)) {
            const { unlinkSync } = await import("node:fs");
            unlinkSync(backup);
        }
    } catch (err) {
        console.error(`❌  ${task.label} failed:`, err.message);
        // Restore from backup
        if (backup && existsSync(backup)) {
            copyFileSync(backup, task.input);
            const { unlinkSync } = await import("node:fs");
            unlinkSync(backup);
        }
    }
}

console.log("Done. Update og-image reference in layout.tsx if you want to serve the .webp version.");
