import type { Chapter } from '$lib/shared/types';

const chapter1 = {
	id: 'ch1',
	title: 'Your First Key',
	description:
		'Understand what a PGP key pair is, how to read a fingerprint, and how to prove your key belongs to you.',
	lessons: [
		{
			id: 'ch1-l1',
			title: 'What is public-key cryptography?',
			description: 'The mailbox analogy — and why sharing your public key is completely safe.',
			xpReward: 10,
			challenges: [
				{
					id: 'ch1-l1-c1',
					setup: {
						type: 'explainer' as const,
						content: `Public-key cryptography gives you two mathematically linked keys: a public key and a private key.

Think of your public key as a mailbox slot. You can share it with anyone — post it on your website, paste it in emails, shout it from the rooftops. Anyone can drop a letter in. That's the point.

Your private key is the actual key that opens that mailbox. You never share it. It stays on your device, usually protected by a passphrase.

Here's what makes this powerful: messages encrypted with your public key can only be decrypted with your private key. And messages signed with your private key can be verified by anyone who has your public key.

This means you can receive encrypted messages from strangers — people who have never spoken to you before — without ever sharing a secret. No password exchange. No secure channel required. Just hand them your public key.

Read this, mark it done, and move on. The next lesson digs into how to identify your key.`
					}
				}
			]
		},
		{
			id: 'ch1-l2',
			title: 'Key anatomy — fingerprints and key IDs',
			description:
				'Learn to identify your key by its fingerprint — the 40-character summary that makes it unique.',
			xpReward: 25,
			challenges: [
				{
					id: 'ch1-l2-c1',
					setup: {
						type: 'quiz' as const,
						question: 'What is a PGP key fingerprint?',
						options: [
							'A short summary of your key that uniquely identifies it',
							'A password that protects your private key from unauthorized use',
							'The name of the person who created the key',
							'A digital signature attached to your public key by a certificate authority'
						],
						correctOption: 0
					},
					hint: 'A fingerprint is derived from the key itself — not from who owns it or how it is protected.'
				}
			]
		},
		{
			id: 'ch1-l3',
			title: 'Export and share your public key',
			description: 'What ASCII armor is, and the right way to share your public key with others.',
			xpReward: 25,
			challenges: [
				{
					id: 'ch1-l3-c1',
					setup: {
						type: 'explainer' as const,
						content: `A PGP public key is binary data. To share it over email, chat, or a website, you convert it to text — a format called ASCII armor.

ASCII armor wraps the key data in a distinctive header and footer:

  -----BEGIN PGP PUBLIC KEY BLOCK-----
  ... base64-encoded key data ...
  -----END PGP PUBLIC KEY BLOCK-----

This is what you paste when someone asks for your public key. It looks intimidating, but it is just your key in a copy-pasteable form.

To export your armored public key with GPG:

  gpg --armor --export your@email.com

Or to export by fingerprint:

  gpg --armor --export YOURFINGERPRINT

The output is your public key. You can share this anywhere. Posting it publicly does not create any security risk — your private key never appears in this output.`
					}
				},
				{
					id: 'ch1-l3-c2',
					setup: {
						type: 'quiz' as const,
						question: 'What is the primary purpose of sharing your PGP public key with someone?',
						options: [
							'To let them log in to systems on your behalf',
							'To allow them to verify your identity documents',
							'To allow them to send you encrypted messages that only you can read',
							'To give them access to your private key in an emergency'
						],
						correctOption: 2
					}
				}
			]
		},
		{
			id: 'ch1-l4',
			title: 'Sign a message to prove ownership',
			description:
				'Prove you hold the private key that matches your public key by signing a short message.',
			xpReward: 50,
			challenges: [
				{
					id: 'ch1-l4-c1',
					setup: {
						type: 'sign' as const,
						plaintext:
							'I am the owner of this PGP key. Pretty Good Playground registration challenge.'
					},
					hint: `To sign a message with GPG, use the --clearsign flag:

  echo "I am the owner of this PGP key. Pretty Good Playground registration challenge." | gpg --clearsign

This produces a signed message block starting with -----BEGIN PGP SIGNED MESSAGE-----. Copy the entire output — header, content, signature, and footer — and paste it below.

On Windows with Kleopatra: open Notepad, paste the text, then use Tools → Notepad → Sign.`
				}
			]
		}
	]
} satisfies Chapter;

export default chapter1;
