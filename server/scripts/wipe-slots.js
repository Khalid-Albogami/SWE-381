/**
 * One-shot migration: wipe all slots from the DB.
 *
 * Used when introducing pitches — legacy slots don't have pitchId/price.
 * Owners will re-create slots after defining their pitches.
 *
 * Usage:
 *   node scripts/wipe-slots.js            # apply
 *   node scripts/wipe-slots.js --dry-run  # count only, no writes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Slot = require('../models/Slot');

const DRY = process.argv.includes('--dry-run');

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`[wipe-slots] connected${DRY ? ' (DRY RUN — no writes)' : ''}`);

  const count = await Slot.countDocuments({});
  console.log(`[wipe-slots] slots in DB: ${count}`);

  if (!DRY && count > 0) {
    const result = await Slot.deleteMany({});
    console.log(`[wipe-slots] deleted ${result.deletedCount} slot(s)`);
  } else if (DRY) {
    console.log(`[wipe-slots] WOULD delete ${count} slot(s)`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('[wipe-slots] failed', e);
  process.exit(1);
});
