import type { KVNamespace } from '@cloudflare/workers-types';

export interface KvStore {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
	delete(key: string): Promise<void>;
}

const devMainStore = new Map<string, string>();
const devEphemeralStore = new Map<string, string>();

function wrapKvNamespace(kv: KVNamespace): KvStore {
	return {
		get: (key) => kv.get(key),
		put: (key, value, opts) =>
			kv.put(key, value, opts?.expirationTtl ? { expirationTtl: opts.expirationTtl } : undefined),
		delete: (key) => kv.delete(key)
	};
}

function createDevStore(store: Map<string, string>): KvStore {
	return {
		get: async (key) => store.get(key) ?? null,
		put: async (key, value) => {
			store.set(key, value);
		},
		delete: async (key) => {
			store.delete(key);
		}
	};
}

export function getMainKv(platform: App.Platform | undefined): KvStore {
	return platform ? wrapKvNamespace(platform.env.MAIN_KV) : createDevStore(devMainStore);
}

export function getEphemeralKv(platform: App.Platform | undefined): KvStore {
	return platform
		? wrapKvNamespace(platform.env.EPHEMERAL_KV)
		: createDevStore(devEphemeralStore);
}

export const userKey = (fingerprint: string): string => `user:v1:${fingerprint}`;
export const progressKey = (fingerprint: string): string => `progress:v1:${fingerprint}`;
export const flashKey = (fingerprint: string): string => `flash:v1:${fingerprint}`;
export const challengeKey = (fingerprint: string, nonceHex: string): string =>
	`challenge:v1:${fingerprint}:${nonceHex}`;
export const pendingAuthKey = (fingerprint: string): string => `pending_auth:v1:${fingerprint}`;
export const rateLimitKey = (endpoint: string, identifier: string, minute: number): string =>
	`rl:v1:${endpoint}:${identifier}:${minute}`;
