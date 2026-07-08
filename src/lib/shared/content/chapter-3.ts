import type { Chapter } from "$lib/shared/types";

const chapter3 = {
  id: "ch3",
  title: "Encryption",
  description: "Send messages that only the intended recipient can read, using their public key.",
  lessons: [
    {
      id: "ch3-l1",
      title: "Asymmetric encryption explained",
      description:
        "The locked-box analogy — why anyone can encrypt but only one person can decrypt.",
      xpReward: 10,
      challenges: [
        {
          id: "ch3-l1-c1",
          setup: {
            type: "explainer" as const,
            content: `Asymmetric encryption is different from the kind of encryption you might use to lock a file with a password.

With password encryption (symmetric), the same key locks and unlocks. Whoever has the password can both encrypt and decrypt.

With PGP (asymmetric), the locking and unlocking keys are different:

- Anyone with your public key can lock a message for you. They encrypt to your public key.
- Only you, with your private key, can unlock it. You decrypt with your private key.

Think of it as a box with a special lock. You hand out copies of the open lock to anyone who wants to send you a message. They put their message in the box and snap the lock shut. Now only you — the person with the key that fits that specific lock — can open it.

This is why you can safely post your public key on the internet. Posting it does not let anyone read your messages. It does the opposite: it lets people send you messages that nobody else can read.

In the next lesson you will encrypt a message to the challenge service key. The server holds the matching private key and will decrypt your message to check it.`
          }
        }
      ]
    },
    {
      id: "ch3-l2",
      title: "Encrypt a message",
      description: "Encrypt a short message to the challenge public key and submit the ciphertext.",
      xpReward: 75,
      challenges: [
        {
          id: "ch3-l2-c1",
          setup: {
            type: "encrypt" as const,
            plaintext: "Hello from Pretty Good Playground! This message proves you can encrypt.",
            recipientPublicKey: "PLACEHOLDER_CHALLENGE_PUBLIC_KEY"
          },
          hint: `To encrypt a message with GPG:

  echo "Hello from Pretty Good Playground! This message proves you can encrypt." | gpg --armor --encrypt --recipient FINGERPRINT

Replace FINGERPRINT with the fingerprint shown for the recipient key above. You can also import the key first:

  gpg --import  # then paste the key block and press Ctrl+D

Then encrypt. The output starts with -----BEGIN PGP MESSAGE-----. Paste the entire block below.

On Android (OpenKeychain): tap Encrypt/Sign → encrypt only → select the recipient key → encrypt → copy the result.`
        }
      ]
    },
    {
      id: "ch3-l3",
      title: "Decrypt a message",
      description: "Use your private key to decrypt a message the server encrypted for you.",
      xpReward: 75,
      challenges: [
        {
          id: "ch3-l3-c1",
          setup: {
            type: "decrypt" as const,
            ciphertext: "PLACEHOLDER_ENCRYPTED_CIPHERTEXT"
          },
          hint: `To decrypt a PGP message with GPG, copy the entire ciphertext block (including the headers), save it to a file, then:

  gpg --decrypt message.asc

Or pipe it directly:

  cat message.asc | gpg --decrypt

GPG will ask for your passphrase if your private key is protected by one. The decrypted plaintext will be printed to the terminal. Copy that text and paste it below.`
        }
      ]
    },
    {
      id: "ch3-l4",
      title: "Sign and encrypt together",
      description:
        "Combine signing and encryption: prove authorship and protect confidentiality at once.",
      xpReward: 100,
      challenges: [
        {
          id: "ch3-l4-c1",
          setup: {
            type: "sign" as const,
            plaintext:
              "Sign this message first, then encrypt it to the challenge key. Paste the encrypted result."
          },
          hint: `Sign-then-encrypt is the standard order in PGP. First sign with your private key, then encrypt the signed output to the recipient's public key.

With GPG in one step:

  echo "Sign this message first, then encrypt it to the challenge key. Paste the encrypted result." | gpg --armor --sign --encrypt --recipient CHALLENGE_FINGERPRINT

The --sign flag adds your signature before encryption. The recipient sees both the message and your signature when they decrypt.

The output starts with -----BEGIN PGP MESSAGE----- (not SIGNED MESSAGE — because it is encrypted). Paste the entire block below.`
        }
      ]
    }
  ]
} satisfies Chapter;

export default chapter3;
