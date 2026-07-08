import type { Chapter } from "$lib/shared/types";

const chapter5 = {
  id: "ch5",
  title: "Real-World PGP",
  description:
    "Practical knowledge for keeping your keys safe, maintaining them over time, and using PGP in everyday tools.",
  lessons: [
    {
      id: "ch5-l1",
      title: "Private key security and backups",
      description:
        "The one thing that protects your entire PGP identity — and what happens if you lose it.",
      xpReward: 25,
      challenges: [
        {
          id: "ch5-l1-c1",
          setup: {
            type: "quiz" as const,
            question: "What is the best practice for backing up your private key?",
            options: [
              "Email a copy to yourself so it is always recoverable",
              "Store it in a password manager alongside your other credentials",
              "Encrypt it with a strong passphrase and store the backup offline on physical media",
              "Leave it only on the device where it was generated and rely on disk backups"
            ],
            correctOption: 2
          },
          hint: "Offline storage means an attacker who compromises your computer or online accounts cannot reach the backup."
        }
      ]
    },
    {
      id: "ch5-l2",
      title: "Key expiry and rotation",
      description:
        "Why PGP keys expire, how to extend them, and when to generate a new key instead.",
      xpReward: 25,
      challenges: [
        {
          id: "ch5-l2-c1",
          setup: {
            type: "explainer" as const,
            content: `PGP keys can have an expiration date set when they are created — or added later. An expiry date is optional but strongly recommended.

Why expire keys?

If your key is compromised and you cannot revoke it (because you lost your revocation certificate), an expiry date limits the damage. Eventually the key stops being trusted for new messages.

An expiry date also serves as a signal: it forces you to regularly review your key situation. Renewing a key means confirming the private key still exists, the passphrase still works, and you still control the key.

How to set or extend an expiry date with GPG:

  gpg --edit-key YOUR_FINGERPRINT
  gpg> expire
  # Follow the prompts to set a new date
  gpg> save

After changing the expiry, export and re-share your public key so others see the updated date.

If your key has been compromised — even slightly suspected — do not extend it. Generate a new key pair and revoke the old one.`
          }
        },
        {
          id: "ch5-l2-c2",
          setup: {
            type: "quiz" as const,
            question: "What happens when a PGP key reaches its expiration date?",
            options: [
              "The key is automatically deleted from your keyring and all key servers",
              "New messages cannot be encrypted or signed with it until the expiry date is extended",
              "All previous signatures made with the key become permanently invalid",
              "The private key file is overwritten with random data for security"
            ],
            correctOption: 1
          },
          hint: "Expiry affects future use, not past signatures. A message signed before the key expired was valid when it was signed."
        }
      ]
    },
    {
      id: "ch5-l3",
      title: "PGP in email clients",
      description: "How to use PGP with Thunderbird, Apple Mail, and other common email clients.",
      xpReward: 10,
      challenges: [
        {
          id: "ch5-l3-c1",
          setup: {
            type: "explainer" as const,
            content: `PGP encryption works in email — it was literally designed for it. Here is how to set it up in the most common clients.

**Mozilla Thunderbird**
Thunderbird includes built-in OpenPGP support (no plugin required since version 78). Go to Account Settings → End-To-End Encryption → Add Key. Import your existing key or generate a new one. Once set up, compose windows show a lock icon and signature toggle.

**Apple Mail**
Apple Mail supports S/MIME natively but not OpenPGP directly. For OpenPGP, use GPG Suite (gpgtools.org), which adds OpenPGP support via a system plugin. After installation, compose windows show encryption and signing icons in the toolbar.

**Outlook (Windows)**
Outlook also prefers S/MIME. For OpenPGP, Gpg4win includes a plugin called GpgOL that integrates with Outlook. Free and open source.

**Webmail (Gmail, Outlook.com, Proton Mail)**
Proton Mail encrypts between Proton users automatically and supports importing your own PGP key for external contacts. For Gmail and Outlook.com, browser extensions like FlowCrypt provide PGP support, though these require trusting the extension.

The important thing: PGP email encryption only protects the message body. Subject lines, recipient addresses, and metadata travel in the clear. For metadata protection, end-to-end encrypted messaging apps (Signal, etc.) are a better fit.`
          }
        }
      ]
    },
    {
      id: "ch5-l4",
      title: "Capstone — decrypt a story",
      description:
        "The final challenge. Decrypt a message encrypted to your registered public key.",
      xpReward: 150,
      challenges: [
        {
          id: "ch5-l4-c1",
          setup: {
            type: "decrypt" as const,
            ciphertext: "PLACEHOLDER_CAPSTONE_CIPHERTEXT"
          },
          hint: `This message was encrypted to the public key you registered with Pretty Good Playground. Use your private key to decrypt it.

GPG command:

  cat capstone.asc | gpg --decrypt

Or save the ciphertext to a file and run gpg --decrypt capstone.asc.

If GPG asks for your passphrase, that is the passphrase that protects your private key — the one you set when you created your key.

Once decrypted, read the message and paste its contents below.`
        }
      ]
    }
  ]
} satisfies Chapter;

export default chapter5;
