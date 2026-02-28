/**
 * Core domain types for the translation job orchestration layer.
 *
 * These types are intentionally kept in `core/` (not `features/`) so that the
 * translation domain can be consumed by any feature without creating cross-feature
 * imports.  Phase-4 will replace the mock implementations with real STT/MT/TTS
 * service adapters while keeping every type contract here unchanged.
 */

// ─── Language ────────────────────────────────────────────────────────────────

/** ISO 639-1 codes for languages supported by the translation pipeline. */
export type SupportedLanguage = 'EN' | 'FR' | 'AR' | 'ES';

// ─── Translation Job ─────────────────────────────────────────────────────────

/**
 * Lifecycle states for a translation job.
 *
 * | State     | Meaning                                              |
 * |-----------|------------------------------------------------------|
 * | `idle`    | No job in flight (initial state, also after cancel). |
 * | `ready`   | Job created, waiting to be dispatched.               |
 * | `running` | STT/Translation/TTS pipeline is active.              |
 * | `failed`  | Pipeline reported an error.                          |
 * | `done`    | Pipeline completed successfully.                     |
 */
export type JobStatus = 'idle' | 'ready' | 'running' | 'failed' | 'done';

/** Immutable snapshot of a translation job at a point in time. */
export interface TranslationJob {
  /** Unique job identifier (format: `job-<timestamp>`). */
  id: string;
  status: JobStatus;
  /** Content source that feeds this job.  Only Instagram is supported in Phase-3. */
  source: 'instagram';
  targetLanguage: SupportedLanguage;
  /** Unix ms timestamp when the job transitioned to `running`. */
  startedAt?: number;
  /** Unix ms timestamp of the most recent status update. */
  updatedAt?: number;
  /**
   * 0–100 progress percentage.  Only meaningful while `status === 'running'`.
   * Phase-4 will populate this from actual STT/MT/TTS pipeline progress events.
   */
  progressPct?: number;
}

// ─── Service interface ───────────────────────────────────────────────────────

/** Input required to create a new translation job. */
export interface TranslationJobInput {
  source: 'instagram';
  targetLanguage: SupportedLanguage;
}

/**
 * Contract that every translation service adapter must implement.
 *
 * Phase-3 ships a `MockTranslationService` that simulates progress with a
 * timer.  Phase-4 will provide a `LiveTranslationService` that orchestrates
 * actual STT/MT/TTS API calls.
 */
export interface TranslationService {
  /**
   * Enqueue a new job and start processing it.
   *
   * @param input       Job parameters.
   * @param onUpdate    Callback invoked on every state transition (including
   *                    incremental progress ticks).  The callback receives a
   *                    full immutable snapshot of the job on each call.
   * @returns           The new job's unique identifier.
   */
  start(input: TranslationJobInput, onUpdate: (job: TranslationJob) => void): string;

  /**
   * Return the latest snapshot of the given job, or `undefined` if not found.
   */
  getStatus(jobId: string): TranslationJob | undefined;

  /**
   * Abort a running job.  Triggers a final `onUpdate` with `status: 'idle'`
   * so the caller can reset its UI.
   */
  cancel(jobId: string): void;
}
