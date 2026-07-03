import type { Chapter } from '$lib/shared/types';

const chapter2 = {
	id: 'ch2',
	title: 'Signing & Verifying',
	description:
		'Learn to create and check digital signatures — the foundation of PGP authentication.',
	lessons: [
		{
			id: 'ch2-l1',
			title: 'What is a digital signature?',
			description: 'The wax seal analogy — how signatures prove authorship without hiding content.',
			xpReward: 10,
			challenges: [
				{
					id: 'ch2-l1-c1',
					setup: {
						type: 'explainer' as const,
						content: `A digital signature is like a wax seal on a letter. You are not hiding the message — anyone can read it. You are proving it came from you and has not been changed since you sent it.

Here is how it works:

1. Your PGP software takes the message and runs it through a hash function, producing a short fingerprint of the message content.
2. Your private key is used to encrypt that fingerprint. That encrypted fingerprint is the signature.
3. You send the message alongside the signature.

When someone wants to verify:
1. They use your public key to decrypt the signature, recovering the original fingerprint.
2. They run the message through the same hash function.
3. If the fingerprints match, the message came from you and was not modified in transit.

One important consequence: you cannot deny having signed something. Once your signature is on a message, anyone with your public key can verify it. This property is called non-repudiation, and you will learn more about it in this chapter.`
					}
				}
			]
		},
		{
			id: 'ch2-l2',
			title: 'Sign a message',
			description: 'Use your PGP tool to sign a message and paste the signed output.',
			xpReward: 75,
			challenges: [
				{
					id: 'ch2-l2-c1',
					setup: {
						type: 'sign' as const,
						plaintext:
							'The quick brown fox jumps over the lazy dog. This message was signed with PGP.'
					},
					hint: `GPG command to create a cleartext signature:

  echo "The quick brown fox jumps over the lazy dog. This message was signed with PGP." | gpg --clearsign

You can also pipe from a file:

  gpg --clearsign message.txt

The result starts with -----BEGIN PGP SIGNED MESSAGE----- and ends with -----END PGP SIGNATURE-----. Copy the entire block including the headers.

OpenKeychain (Android): tap the three dots → Sign → paste the text → sign → copy the result.`
				}
			]
		},
		{
			id: 'ch2-l3',
			title: 'Verify a signature',
			description:
				'Use your PGP tool to verify a signed message and confirm who signed it.',
			xpReward: 75,
			challenges: [
				{
					id: 'ch2-l3-c1',
					setup: {
						type: 'verify' as const,
						signedMessage: `-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Welcome to Pretty Good Playground. This message was signed by the challenge service key to demonstrate what a valid signed message looks like. Verify it with your PGP tool and paste the text it contains.
-----BEGIN PGP SIGNATURE-----

PLACEHOLDER_SIGNATURE_DATA_WILL_BE_REPLACED_IN_PHASE_9
=AAAA
-----END PGP SIGNATURE-----`,
						expectedSignerFingerprint: 'PLACEHOLDER_CHALLENGE_KEY_FINGERPRINT'
					},
					hint: `To verify a signed message with GPG, save the message to a file then run:

  gpg --verify message.asc

GPG will tell you whether the signature is valid and who signed it.

The message content (what you paste below) is the text between the "Hash:" line and the "-----BEGIN PGP SIGNATURE-----" line. Do not include the PGP headers or signature block — just the plaintext message itself.`
				}
			]
		},
		{
			id: 'ch2-l4',
			title: 'Why signatures matter — non-repudiation',
			description:
				'Understand non-repudiation: why a valid signature means the signer cannot deny their authorship.',
			xpReward: 25,
			challenges: [
				{
					id: 'ch2-l4-c1',
					setup: {
						type: 'quiz' as const,
						question: 'What does non-repudiation mean in the context of digital signatures?',
						options: [
							'The ability to revoke a signature after it has been verified',
							'The property that a signer cannot later deny having signed a message',
							'The encryption of the signature so that only the recipient can read it',
							'The ability to sign a message anonymously without revealing your identity'
						],
						correctOption: 1
					},
					hint: 'Think about what a valid signature proves: the private key was used, and only the key holder has the private key.'
				}
			]
		}
	]
} satisfies Chapter;

export default chapter2;
