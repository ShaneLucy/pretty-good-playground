import { readKey, readCleartextMessage, verify, type PublicKey } from 'openpgp';

export class PgpError extends Error {
	constructor(
		message: string,
		public readonly code: 'INVALID_KEY' | 'INVALID_SIGNATURE' | 'PARSE_ERROR'
	) {
		super(message);
		this.name = 'PgpError';
	}
}

export async function readPublicKey(armoredKey: string): Promise<PublicKey> {
	try {
		return await readKey({ armoredKey });
	} catch (e) {
		throw new PgpError(
			e instanceof Error ? e.message : 'Failed to parse public key',
			'INVALID_KEY'
		);
	}
}

export function extractFingerprint(key: PublicKey): string {
	return key.getFingerprint().toUpperCase();
}

export async function verifySignature(params: {
	armoredSignedMessage: string;
	publicKey: PublicKey;
}): Promise<{ valid: boolean; text: string }> {
	try {
		const message = await readCleartextMessage({
			cleartextMessage: params.armoredSignedMessage
		});
		const result = await verify({
			message,
			verificationKeys: params.publicKey
		});
		const sig = result.signatures[0];
		if (!sig) return { valid: false, text: result.data };
		try {
			await sig.verified;
			return { valid: true, text: result.data };
		} catch {
			return { valid: false, text: result.data };
		}
	} catch {
		return { valid: false, text: '' };
	}
}
