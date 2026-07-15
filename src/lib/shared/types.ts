/**
 * Shared domain types for Pretty Good Playground.
 *
 * These describe the curriculum content shape, the KV-persisted user/progress
 * records, and cross-cutting UI concerns (flash messages). Content and
 * curriculum shapes are `readonly` because they are authored once and never
 * mutated at runtime.
 */

/**
 * The kind of a challenge. Acts as the discriminant for {@link ChallengeSetup}.
 */
export const CHALLENGE_TYPES = [
  "sign",
  "verify",
  "encrypt",
  "decrypt",
  "quiz",
  "explainer"
] as const;

export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

/**
 * Per-type setup payload for a challenge, discriminated by `type`.
 */
export type ChallengeSetup =
  | {
      readonly type: "sign";
      readonly plaintext: string;
    }
  | {
      readonly type: "verify";
      readonly signedMessage: string;
      readonly expectedSignerFingerprint: string;
    }
  | {
      readonly type: "encrypt";
      readonly plaintext: string;
      readonly recipientPublicKey: string;
    }
  | {
      readonly type: "decrypt";
      readonly ciphertext: string;
    }
  | {
      readonly type: "quiz";
      readonly question: string;
      readonly options: readonly string[];
      readonly correctOption: number;
    }
  | {
      readonly type: "explainer";
      readonly content: string;
    };

/**
 * A single challenge within a lesson.
 *
 * `id` is permanent and stable (e.g. `'ch1-l2-c1'`); it is used as the key for
 * progress tracking, so it must never change once published.
 */
export interface Challenge {
  readonly id: string;
  readonly setup: ChallengeSetup;
  readonly hint?: string;
}

/**
 * A lesson: an ordered collection of challenges plus its XP reward.
 */
export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly challenges: readonly Challenge[];
  readonly xpReward: number;
}

/**
 * A chapter: an ordered collection of lessons.
 */
export interface Chapter {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly lessons: readonly Lesson[];
}

/**
 * A registered user, stored in KV at `user:v1:{fingerprint}`.
 */
export interface UserRecord {
  readonly fingerprint: string;
  readonly displayName: string;
  readonly publicKey: string;
  /** ISO 8601 timestamp of registration. */
  readonly registeredAt: string;
  readonly profilePublic: boolean;
}

/**
 * A user's progress, stored in KV at `progress:v1:{fingerprint}`.
 */
export interface ProgressRecord {
  readonly fingerprint: string;
  /** Completed challenge IDs (see {@link Challenge.id}). */
  readonly completedChallenges: readonly string[];
  readonly xp: number;
  readonly level: number;
  readonly achievements: readonly string[];
  /** ISO 8601 timestamp of the user's last activity. */
  readonly lastActivityAt: string;
  readonly streakDays: number;
  /** ISO date string (YYYY-MM-DD) of the last day activity occurred, for streak tracking. */
  readonly streakLastDate?: string;
  /** Cached lesson IDs for completed lessons. */
  readonly completedLessons?: readonly string[];
  /** Total hints opened across all challenges, for the paranoid_compliment achievement. */
  readonly totalHintsUsed?: number;
}

/**
 * The severity/intent of a flash message shown to the user.
 */
export type FlashMessageType = "success" | "error" | "warning" | "info" | "achievement";

/**
 * A transient message surfaced to the user after an action.
 */
export interface FlashMessage {
  readonly type: FlashMessageType;
  readonly message: string;
}
