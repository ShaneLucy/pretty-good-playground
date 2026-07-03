import type { KvStore } from './kv';
import { rateLimitKey } from './kv';

export async function rateLimit(
	kv: KvStore,
	endpoint: string,
	identifier: string,
	limit: number
): Promise<{ allowed: boolean }> {
	const minute = Math.floor(Date.now() / 60_000);
	const [prevStr, currStr] = await Promise.all([
		kv.get(rateLimitKey(endpoint, identifier, minute - 1)),
		kv.get(rateLimitKey(endpoint, identifier, minute))
	]);
	const prevCount = prevStr !== null ? (parseInt(prevStr, 10) || 0) : 0;
	const currCount = currStr !== null ? (parseInt(currStr, 10) || 0) : 0;
	const elapsed = (Date.now() % 60_000) / 60_000;
	const estimate = prevCount * (1 - elapsed) + currCount;
	if (estimate >= limit) return { allowed: false };
	await kv.put(rateLimitKey(endpoint, identifier, minute), String(currCount + 1), {
		expirationTtl: 120
	});
	return { allowed: true };
}
