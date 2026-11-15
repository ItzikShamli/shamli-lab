# Shamli Lab — Plan

## The repo
- GitHub: https://github.com/ItzikShamli/shamli-lab (public)
- Hosted free with GitHub Pages, from branch `main`, root folder
- Live link: https://itzikshamli.github.io/shamli-lab/

## Structure
```
shamli-lab/
├── index.html              ← home page listing everything (more apps may come later)
└── learning-lab/
    ├── index.html          ← list of learning games
    └── fun-with-math/      ← the first game
```

Each game is its own small app in its own folder. Don't make one big game that does everything.

## Tech
- Plain HTML, CSS and JavaScript. No build step, no frameworks, no npm.
- Works offline (a PWA with a service worker and a manifest), so it can be added to the iPad Home Screen and played with no internet.
- When a new version ships, make sure the iPad picks it up (bump the service worker cache version).

## Who plays
- Kids, starting with two kids aged 4 and 6.
- THEY CAN'T READ. No words on screen that they need to understand. Use only pictures, numbers, dots or objects, sounds and animations.
- Adult-only screens (creating a profile, the parent screen) may use words.

## Device
- iPad mini only, held sideways (landscape), opened full screen from the Home Screen.
- Huge buttons with plenty of space between them.
- Safari quirk: sound only plays after the first tap, so start with a big "play" button.

## Voice
- **Hebrew**, using the iPad's built-in voice (the browser's speech API). Numbers are spoken as Hebrew words.
- Every question is read out loud, and a speaker button replays it.
- Prefer an "Enhanced" or "Premium" Hebrew voice (e.g. Carmit Enhanced) when the iPad has one.
- Only the voice is Hebrew. The parent screens stay in English.

## The first game: Fun With Math (`learning-lab/fun-with-math/`)
- **Profiles (decided):** the game is meant to be shared, so there are no built-in kids. Anyone can create their own profile: enter a name, pick a picture, and pick a starting level. Creating a profile is an adult task, behind the adult math question.
- Each kid taps their own picture to start. That picks their level and their coin jar.
- Little level (about age 4): counting ("how many?"), which group has more, matching a number to dots.
- Big level (about age 6): adding and taking away, up to 10 first, then up to 20.
- It gets harder on its own when they keep getting answers right.
- Every number shows next to the matching number of dots or objects.

## Coins (pretend money for home rewards, no real money)
- Coins per question: 1 if right on the first tap, ½ if right after one wrong tap, 0 after two or more wrong taps. Plus a bonus for finishing a round. Coins can be halves (shown as 12½).
- Prize list (prices — buying a prize takes the coins out of the jar):
  - 🍦 Ice cream = 100 coins
  - 🎮 Pokémon game = 200 coins
  - 🧱 Lego game = 300 coins
- Kids see the prize list as pictures after each round, each with a bar filling up with their coins.
- Each prize's picture can be changed on the parent screen: pick an emoji, type any emoji, or use a photo from the iPad (shrunk and saved on the iPad).
- Each profile has its own coin jar, saved on the iPad.
- A parent screen, locked behind an adult math question (like 7 × 8), where a parent spends coins on home rewards and sets prices (for example: ice cream = 10 coins).

## Take-away picture
- The sum is on top. Below it is ONE picture of the first number: the ones that stay, and the ones taken away in a red dashed box (red matches the red number being taken away). After a moment the taken-away ones hop and fade with a red ✕, so what's left is easy to count.

## Decisions log
- v1.2: half coin on the second try, none after that; prize pictures can be any emoji or a photo.
- v1.1: voice in Hebrew (parent screens stay English); prize list 100/200/300 as prices; clearer take-away picture.
- Game name: **fun-with-math** → https://itzikshamli.github.io/shamli-lab/learning-lab/fun-with-math/
- Kid pictures: each user creates their own profile (name + picture), so the game can be shared.

## How we work
- Test only on the iPad, using the live GitHub Pages link.
- Work on a branch and open a pull request. The owner merges it, then tests on the iPad.
- Test what we can before opening the PR (check the JavaScript runs with no errors).
