import type { Chapter } from '$lib/shared/types';

const chapter4 = {
	id: 'ch4',
	title: 'Trust & Identity',
	description:
		"Explore the web of trust — how PGP users vouch for each other's keys and build networks of verified identity.",
	lessons: [
		{
			id: 'ch4-l1',
			title: 'The web of trust',
			description:
				'How trust propagates through key signatures — and why it matters for key verification.',
			xpReward: 10,
			challenges: [
				{
					id: 'ch4-l1-c1',
					setup: {
						type: 'explainer' as const,
						content: `How do you know a public key actually belongs to the person who claims to own it?

This is the key verification problem, and the web of trust is PGP's answer to it.

The idea: you trust the keys you have personally verified. When you verify someone's key — by meeting them in person, checking their photo ID, and confirming their fingerprint — you can sign their key to publicly record that verification.

Now suppose Alice has signed Bob's key. If you trust Alice to do careful key verification, you can extend some of that trust to Bob, even if you have never met Bob.

This creates a web: a graph of signatures where trust propagates through human relationships. If you know many people who have signed a key, and you trust some of those signers, that key has strong support in your web.

Contrast this with certificate authorities (the system used by HTTPS): a central organization vouches for websites. In PGP, no single authority controls trust. Your web of trust is personal to you.

This is powerful and imperfect. The web of trust requires you to actively participate in it — verifying keys, signing keys, building your network.`
					}
				}
			]
		},
		{
			id: 'ch4-l2',
			title: "Sign someone else's key",
			description:
				'Practice the key signing ceremony — verify an identity claim and record your trust.',
			xpReward: 75,
			challenges: [
				{
					id: 'ch4-l2-c1',
					setup: {
						type: 'sign' as const,
						plaintext:
							'I certify that I have verified the identity of the key holder with fingerprint ABCD1234EFGH5678IJKL9012MNOP3456QRST7890 and trust this key belongs to them.'
					},
					hint: `In real life, you would sign another person's actual PGP key using gpg --sign-key FINGERPRINT. This lesson simulates the intent of that ceremony.

To complete this challenge, sign the statement above with your own private key using --clearsign:

  echo "I certify that I have verified..." | gpg --clearsign

This produces a signed attestation — the same type of commitment you make when signing a real key. Paste the entire signed output below.

For context: when you sign someone's real key, GPG prompts you to confirm the signature level (casual, careful, or full trust). You would then export the signed key and send it back to them.`
				}
			]
		},
		{
			id: 'ch4-l3',
			title: 'Key servers — what they are and the choice to use them',
			description:
				'Understand public key servers and make an informed decision about whether to use them.',
			xpReward: 25,
			challenges: [
				{
					id: 'ch4-l3-c1',
					setup: {
						type: 'explainer' as const,
						content: `A key server is a public phonebook for PGP keys. You can upload your public key so that others can find and import it using just your email address or fingerprint.

  gpg --keyserver keys.openpgp.org --send-keys YOUR_FINGERPRINT

The main key servers are keys.openpgp.org and keyserver.ubuntu.com. Uploading to one is optional — it is a trade-off.

Reasons you might upload:
- Others can find your key without you sending it to them.
- Your signed key receives signatures from key-signing parties, making your web of trust stronger.

Reasons you might not:
- Key servers are public and permanent. Once uploaded, a key cannot be fully deleted (though it can be revoked).
- Your email address becomes publicly associated with your fingerprint.
- Some people prefer to share their key only through channels they control.

This lesson requires no challenge submission. Read the above and mark it complete. There is no wrong choice — this is a decision only you can make for your own situation.`
					}
				}
			]
		},
		{
			id: 'ch4-l4',
			title: 'Revocation certificates',
			description:
				'What revocation certificates are, why you should generate one immediately, and how they work.',
			xpReward: 25,
			challenges: [
				{
					id: 'ch4-l4-c1',
					setup: {
						type: 'quiz' as const,
						question: 'What does a PGP revocation certificate do?',
						options: [
							'Tells others that your key should no longer be trusted or used',
							'Permanently and immediately deletes your key from all key servers',
							'Automatically generates a new replacement key pair',
							'Transfers your web-of-trust signatures to a new key'
						],
						correctOption: 0
					},
					hint: 'A revocation certificate does not delete anything — it publishes a signed statement that the key should not be used.'
				}
			]
		}
	]
} satisfies Chapter;

export default chapter4;
