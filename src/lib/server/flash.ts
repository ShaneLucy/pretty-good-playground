import type { FlashMessage } from '$lib/shared/types';
import type { KvStore } from './kv';
import { flashKey } from './kv';

export async function writeFlash(
	kv: KvStore,
	fingerprint: string,
	message: FlashMessage
): Promise<void> {
	await kv.put(flashKey(fingerprint), JSON.stringify(message), { expirationTtl: 60 });
}

export async function readAndClearFlash(
	kv: KvStore,
	fingerprint: string
): Promise<FlashMessage | null> {
	const raw = await kv.get(flashKey(fingerprint));
	if (!raw) return null;
	await kv.delete(flashKey(fingerprint));
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			typeof (parsed as Record<string, unknown>).type === 'string' &&
			typeof (parsed as Record<string, unknown>).message === 'string'
		) {
			return parsed as FlashMessage;
		}
		return null;
	} catch {
		return null;
	}
}
