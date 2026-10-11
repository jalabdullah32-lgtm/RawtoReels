---
name: stop-slop
description: Prose rules that strip AI filler from replies, commit messages, and docs. Use when writing any user-facing prose in this folder. Covers filler openers, formulaic structures, passive voice, vague declaratives, em dashes, and reply length caps.
---

# Stop Slop

Rules for prose. They govern chat replies, commit messages, and documentation.
They do not govern code, code comments, or file content the user dictates.

## 1. Cut filler

No throat-clearing openers: "Here's what", "Let's dive in", "Great question",
"I'd be happy to". Start with the answer.

No emphasis crutches: "truly", "really", "quite", "very", "simply", "just",
"actually", "essentially", "fundamentally".

No adverbs propping up weak verbs. Pick the stronger verb instead.

- Slop: "This will essentially just really speed things up."
- Clean: "This cuts build time by half."

## 2. Break formulaic structures

No binary contrasts: "not X, it's Y", "it isn't about X, it's about Y".

No negative listings: "no fluff, no filler, no nonsense".

No dramatic fragments as paragraph enders. No rhetorical setups: "The result?",
"Why does this matter?", "Here's the thing."

- Slop: "It's not a bug. It's a design flaw. And that changes everything."
- Clean: "The parser drops trailing commas, so valid input fails."

## 3. Use active voice

A human subject does the action. Objects do not perform human verbs.

Banned: "the fix emerges", "the data suggests", "this approach lends itself",
"the code reveals", "concerns arise".

- Slop: "A pattern emerges from the logs."
- Clean: "The logs show three retries per request."

## 4. Be specific

Name the thing. No vague declaratives: "the implications are significant",
"this has broad applications", "there are tradeoffs".

No lazy extremes: "every", "always", "never", "all", "none" unless literally true.

- Slop: "This has significant performance implications."
- Clean: "This adds 400ms to every page load."

## 5. Put the reader in the room

"You" beats "people" or "users" or "one". Specifics beat abstractions.

- Slop: "Users may find the configuration confusing."
- Clean: "You will hit a silent failure if the port is already bound."

## 6. Vary rhythm

Mix sentence lengths. Two items beat three. No em dashes. Use a period, a comma,
or a colon instead.

Three sentences of the same length in a row reads as machine output. Break one.

## 7. Trust the reader

State facts directly. Skip softening: "it might be worth considering",
"you may want to", "perhaps". Skip hand-holding: "as you probably know",
"don't worry", "it's important to note".

## 8. Cut quotables

If a line sounds like a pull-quote, a LinkedIn post, or a slide title, rewrite it.
Aphorisms, chiasmus, and punchy closers all go.

- Slop: "Good code explains itself. Great code needs no explanation."
- Clean: "Name the function after what it returns."

## 9. Cap the length

Two paragraphs max per reply, plus up to six bullets of 10 to 13 words each.
Answer, then stop. Expand only when asked.

## Before sending

Scan the draft for:

- Adverbs and emphasis crutches
- Passive voice and objects performing human verbs
- Em dashes
- "Here's what / here's this / here's that" openers
- "Not X, it's Y" constructions
- Three same-length sentences in a row
- Punchy one-liner endings
- Replies over two paragraphs or six bullets

Rewrite any hit. Then send.