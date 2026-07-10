// One-time migration: some "original"-size images were saved with a filename
// extension inherited from the uploaded file (e.g. .jpg/.png) even though the
// processing pipeline always re-encodes them as WebP. This renames the
// mismatched files to .webp and updates the matching DB columns.
//
// Usage:
//   node scripts/fixImageExtensions.js            (dry run - reports only)
//   node scripts/fixImageExtensions.js --apply     (renames files + updates DB)
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import prisma from '../src/database.js';
import imageService from '../src/services/images/imageService.js';

const SUB_DIRS = ['categories', 'sub-categories', 'products'];
const VARIANT_PREFIXES = ['thumb_', 'medium_', 'small_'];
const APPLY = process.argv.includes('--apply');

async function findMismatches(subDir) {
  const dir = path.join(imageService.baseUploadDir, subDir);
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const mismatches = [];
  for (const filename of entries) {
    if (VARIANT_PREFIXES.some((p) => filename.startsWith(p))) continue; // thumb/medium/small already correct
    if (path.extname(filename).toLowerCase() === '.webp') continue; // already correct

    const filepath = path.join(dir, filename);
    const type = await fileTypeFromFile(filepath).catch(() => null);
    if (type?.mime !== 'image/webp') continue; // genuinely not mismatched (or unreadable)

    const newFilename = `${path.basename(filename, path.extname(filename))}.webp`;
    mismatches.push({
      subDir,
      dir,
      oldFilename: filename,
      newFilename,
      oldUrl: `/uploads/${subDir}/${filename}`,
      newUrl: `/uploads/${subDir}/${newFilename}`,
    });
  }
  return mismatches;
}

async function updateReferences(oldUrl, newUrl) {
  const [category, subCategory, photo, variant] = await Promise.all([
    prisma.category.updateMany({ where: { coverPhoto: oldUrl }, data: { coverPhoto: newUrl } }),
    prisma.subCategory.updateMany({ where: { coverPhoto: oldUrl }, data: { coverPhoto: newUrl } }),
    prisma.photo.updateMany({ where: { url: oldUrl }, data: { url: newUrl } }),
    prisma.productVariant.updateMany({ where: { image: oldUrl }, data: { image: newUrl } }),
  ]);
  return category.count + subCategory.count + photo.count + variant.count;
}

async function main() {
  console.log(APPLY ? 'Running in APPLY mode — files and DB rows will be changed.' : 'Running in DRY RUN mode — nothing will be changed. Pass --apply to execute.');

  const allMismatches = (await Promise.all(SUB_DIRS.map(findMismatches))).flat();

  if (allMismatches.length === 0) {
    console.log('No mismatched files found. Nothing to do.');
    return;
  }

  console.log(`Found ${allMismatches.length} mismatched file(s):`);
  for (const m of allMismatches) {
    console.log(`  ${m.oldUrl}  ->  ${m.newUrl}`);
  }

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to rename files and update the database.');
    return;
  }

  let renamed = 0;
  let dbRowsUpdated = 0;
  let skipped = 0;

  for (const m of allMismatches) {
    const oldPath = path.join(m.dir, m.oldFilename);
    const newPath = path.join(m.dir, m.newFilename);

    try {
      await fs.access(newPath);
      console.warn(`Skipping ${m.oldUrl}: target ${m.newFilename} already exists.`);
      skipped++;
      continue;
    } catch {
      // target doesn't exist — safe to proceed
    }

    await fs.rename(oldPath, newPath);
    renamed++;

    try {
      const count = await updateReferences(m.oldUrl, m.newUrl);
      dbRowsUpdated += count;
      if (count === 0) {
        console.log(`Renamed ${m.oldUrl} -> ${m.newUrl} (no DB references found — orphaned file)`);
      }
    } catch (err) {
      console.error(`Renamed ${m.oldFilename} but DB update failed — reverting rename. Error:`, err.message);
      await fs.rename(newPath, oldPath).catch(() => {});
      renamed--;
    }
  }

  console.log(`\nDone. Renamed ${renamed} file(s), updated ${dbRowsUpdated} DB row(s), skipped ${skipped}.`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
