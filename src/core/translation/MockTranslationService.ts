/**
 * MockTranslationService
 *
 * Scaffolded implementation of `TranslationService` for Phase-3.
 * Simulates a realistic job lifecycle using a periodic timer:
 *   - Job begins at 0 % and ticks every TICK_INTERVAL_MS.
 *   - After MOCK_DURATION_MS the job transitions to `done` at 100 %.
 *   - Cancelling stops the timer and emits a final `idle` snapshot.
 *
 * Phase-4 will replace this class with `LiveTranslationService` which
 * delegates to real STT / machine-translation / TTS adapters.
 * The public interface (`TranslationService`) stays unchanged.
 */

import Logger from '../logger';
import { TranslationJob, TranslationJobInput, TranslationService } from './types';

/** Simulated total job duration in milliseconds. */
const MOCK_DURATION_MS = 5_000;

/** How often (ms) the progress ticker fires while a job is running. */
const TICK_INTERVAL_MS = 500;

const TOTAL_TICKS = MOCK_DURATION_MS / TICK_INTERVAL_MS;

export class MockTranslationService implements TranslationService {
  private readonly jobs = new Map<string, TranslationJob>();
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly callbacks = new Map<string, (job: TranslationJob) => void>();

  start(input: TranslationJobInput, onUpdate: (job: TranslationJob) => void): string {
    const id = `job-${Date.now()}`;
    const now = Date.now();

    const job: TranslationJob = {
      id,
      status: 'running',
      source: input.source,
      targetLanguage: input.targetLanguage,
      startedAt: now,
      updatedAt: now,
      progressPct: 0,
    };

    this.jobs.set(id, job);
    this.callbacks.set(id, onUpdate);
    onUpdate({ ...job });
    Logger.info(`MockTranslationService: job ${id} started`, { targetLanguage: input.targetLanguage });

    let ticks = 0;

    const timer = setInterval(() => {
      const current = this.jobs.get(id);
      if (current === undefined || current.status !== 'running') {
        clearInterval(timer);
        this.timers.delete(id);
        return;
      }

      ticks += 1;
      const progressPct = Math.min(100, Math.round((ticks / TOTAL_TICKS) * 100));
      const isDone = progressPct >= 100;

      const updated: TranslationJob = {
        ...current,
        progressPct,
        updatedAt: Date.now(),
        status: isDone ? 'done' : 'running',
      };

      this.jobs.set(id, updated);
      onUpdate({ ...updated });

      if (isDone) {
        clearInterval(timer);
        this.timers.delete(id);
        this.callbacks.delete(id);
        Logger.info(`MockTranslationService: job ${id} done`);
      }
    }, TICK_INTERVAL_MS);

    this.timers.set(id, timer);
    return id;
  }

  getStatus(jobId: string): TranslationJob | undefined {
    return this.jobs.get(jobId);
  }

  cancel(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer !== undefined) {
      clearInterval(timer);
      this.timers.delete(jobId);
    }

    const job = this.jobs.get(jobId);
    if (job === undefined) {
      return;
    }

    // Emit a final idle snapshot so the caller can reset its UI.
    const cancelled: TranslationJob = {
      ...job,
      status: 'idle',
      updatedAt: Date.now(),
    };
    this.jobs.set(jobId, cancelled);

    const cb = this.callbacks.get(jobId);
    if (cb !== undefined) {
      cb({ ...cancelled });
    }
    this.callbacks.delete(jobId);
    Logger.info(`MockTranslationService: job ${jobId} cancelled`);
  }
}
