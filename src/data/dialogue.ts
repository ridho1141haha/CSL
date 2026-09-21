// ============================================================================
// data/dialogue.ts — RE-EXPORT SHIM (v0.14.0).
// Isi graph cerita kini modular di src/data/story/ (per chapter / route /
// ending). Semua import lama tetap lewat path ini, jadi tidak ada churn.
// ============================================================================
export {
  DIALOGUE,
  SPECIAL_NODES,
  MONTAGE_ROOTS,
  STORY_TRIGGER_NODES,
  ZONE_FLAVOR,
  CHECKPOINT_NODES,
  getDialogue,
} from './story/index';
