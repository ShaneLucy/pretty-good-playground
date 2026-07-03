import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KvStore } from './kv';
import { rateLimit } from './rate-limit';

function createMockKv(store = new Map<string, string>()): KvStore {
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

describe('rateLimit', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('allows requests below the limit', async () => {
		const kv = createMockKv();
		const result = await rateLimit(kv, 'login', '1.2.3.4', 10);
		expect(result.allowed).toBe(true);
	});

	it('increments counter on allowed request', async () => {
		const store = new Map<string, string>();
		const kv = createMockKv(store);
		await rateLimit(kv, 'login', 'user', 10);
		const minute = Math.floor(Date.now() / 60_000);
		expect(store.get(`rl:v1:login:user:${minute}`)).toBe('1');
	});

	it('rejects when current count reaches limit', async () => {
		const minute = Math.floor(Date.now() / 60_000);
		const store = new Map([[`rl:v1:login:1.2.3.4:${minute}`, '10']]);
		const kv = createMockKv(store);
		const result = await rateLimit(kv, 'login', '1.2.3.4', 10);
		expect(result.allowed).toBe(false);
	});

	it('counts previous minute at full weight when elapsed ≈ 0', async () => {
		const minute = Math.floor(Date.now() / 60_000);
		vi.spyOn(Date, 'now').mockReturnValue(minute * 60_000); // elapsed = 0

		const store = new Map([[`rl:v1:ep:id:${minute - 1}`, '5']]);
		const kv = createMockKv(store);
		// prevCount=5 * (1-0) + currCount=0 = 5 ≥ limit 5 → rejected
		const result = await rateLimit(kv, 'ep', 'id', 5);
		expect(result.allowed).toBe(false);
	});

	it('discounts previous minute at elapsed ≈ 1', async () => {
		const minute = Math.floor(Date.now() / 60_000);
		vi.spyOn(Date, 'now').mockReturnValue(minute * 60_000 + 59_999); // elapsed ≈ 1

		const store = new Map([[`rl:v1:ep:id:${minute - 1}`, '100']]);
		const kv = createMockKv(store);
		// prevCount=100 * (1-0.9999...) ≈ 0.001 + currCount=0 < limit 5 → allowed
		const result = await rateLimit(kv, 'ep', 'id', 5);
		expect(result.allowed).toBe(true);
	});
});
