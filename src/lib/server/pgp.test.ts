import { describe, it, expect } from 'vitest';
import { readPublicKey, PgpError } from './pgp';

describe('readPublicKey', () => {
	it('throws PgpError for garbage input', async () => {
		await expect(readPublicKey('not a pgp key')).rejects.toBeInstanceOf(PgpError);
	});

	it('throws PgpError with INVALID_KEY code for garbage input', async () => {
		await expect(readPublicKey('garbage')).rejects.toMatchObject({
			code: 'INVALID_KEY'
		});
	});

	it('throws PgpError for empty string', async () => {
		await expect(readPublicKey('')).rejects.toBeInstanceOf(PgpError);
	});
});
