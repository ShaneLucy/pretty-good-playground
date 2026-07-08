import { describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';
import {
	signJwt,
	verifyJwt,
	makeSessionCookie,
	makePendingFpCookie,
	clearSessionCookie,
	clearPendingFpCookie
} from './auth';

const SECRET = 'test-secret-that-is-at-least-32-chars!!';

describe('JWT round-trip', () => {
	it('verifies a token it signed', async () => {
		const token = await signJwt({ sub: 'ABCD1234FINGERPRINT' }, SECRET, '1h');
		const result = await verifyJwt(token, SECRET);
		expect(result).toEqual({ sub: 'ABCD1234FINGERPRINT' });
	});

	it('returns null for a tampered token', async () => {
		const token = await signJwt({ sub: 'ABCD' }, SECRET, '1h');
		const tampered = token.slice(0, -5) + 'ZZZZZ';
		expect(await verifyJwt(tampered, SECRET)).toBeNull();
	});

	it('returns null for a token signed with a different secret', async () => {
		const token = await signJwt({ sub: 'ABCD' }, 'wrong-secret-32-chars-long-here!!', '1h');
		expect(await verifyJwt(token, SECRET)).toBeNull();
	});

	it('returns null for an already-expired token', async () => {
		const secretKey = new TextEncoder().encode(SECRET);
		const expiredToken = await new SignJWT({ sub: 'ABCD' })
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
			.setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
			.sign(secretKey);
		expect(await verifyJwt(expiredToken, SECRET)).toBeNull();
	});
});
