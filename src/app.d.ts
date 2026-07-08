// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { KVNamespace, ExecutionContext } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}

		interface Locals {
			user: {
				fingerprint: string;
				displayName: string;
				publicKey: string;
			} | null;
			flash: import('$lib/shared/types').FlashMessage | null;
		}

		// Extend as needed downstream.
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageData {}

		// interface PageState {}

		interface Platform {
			env: {
				MAIN_KV: KVNamespace;
				EPHEMERAL_KV: KVNamespace;
				JWT_SECRET: string;
				CHALLENGE_PRIVATE_KEY: string;
				CHALLENGE_KEY_PASSPHRASE: string;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
