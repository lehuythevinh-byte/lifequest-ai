# World Lore — LIFEQUEST AI V77

V77 **preserves** the existing world: region names, positions, locks, NPC names,
personas, greetings, and goals are unchanged. This document records the world as it
exists in the live build (read from `LQWorldV60.MAPS` / `LQWorldMaps.list()` and the
town scene), so the Cultural Passport and Herald can be understood in context.

> A Cultural Passport stamp is earned by **living a region's story** — completing a
> local mission, helping a resident with their wish, joining a festival, or restoring a
> Time Echo — never by simply walking in.

## The eight regions

The world map list (in order) and each region's role / English level / landmark:

| # | Region id | Name | Role | English | Landmark |
|---|---|---|---|---|---|
| 1 | `english-town` | English Town | Community (Home Town) | A1–A2 | Library / Town Square |
| 2 | `mining-town` | Minerals Town | Industrial Discovery · "The Echoes Beneath" | A2 | Rail Station / Crystal Cavern |
| 3 | `english-town-past` | Oriaris · 70 Years Ago | Living History | A2–B1 | Oriaris Hall |
| 4 | `art-district` | Art District | Creative Society | B1 | Color Gallery |
| 5 | `tech-co` | Tech-Co | Workplace | B1 | TECH-CO HEADQUARTERS |
| 6 | `old-oriaris` | Old Oriaris | Royal Mystery | B1–B2 | GRAND OPERA |
| 7 | `wish-valley` | Wish Valley | Living Sanctuary | B2 | ROOT HOME · VAELA |
| 8 | `vocalt-greedy-land` | Vocalt · Greedy Land | Merchant Society | B2–C1 | CHRONOS · FINE CLOCKS |

Notes:
- The Passport's display metadata (`CORE_META`) gives `english-town` the friendly label
  "English Town · Home Town · A1–B1 · Town Square" and `mining-town` "Mining Town · The
  Echoes Beneath · A2–B1 · Crystal Cavern". The underlying world data above is
  authoritative; the Passport only overrides the *display* for these two home regions.
- Regions remain **locked/gated** by the base game's progression. V77 does not unlock
  the map; the Passport shows every region but marks unearned stamps `SEALED` with a
  hint on how to earn them.
- `english-town-past` is the "70 years ago" living-history layer of the home town;
  `old-oriaris` is the royal-mystery era. Time Echoes (`v60.echoes`) restore memories
  tied to these places.

## English Town residents (NPC roster)

Names, personas, greetings, and goals are exactly as in the base game. Each resident
has a wish (goal) that, when fulfilled in English, marks `mem[id].goalDone` — the
evidence the Passport uses for "helped a resident".

| id | Name | Their wish (goal) |
|---|---|---|
| `barista` | Lily (Barista) | Order a drink at the cafe (say what you would like). |
| `mayor` | Mr. Brown (Mayor) | Suggest an idea to improve the town (a park, a school, a road…). |
| `librarian` | Ms. Green (Librarian) | Ask Ms. Green to recommend a book. |
| `shopkeeper` | Tom (Shopkeeper) | Ask for the price of something and buy it. |
| `kid` | Mia (Student) | Introduce yourself to Mia (say your name and something about you). |
| `doctor` | Dr. Chen (Doctor) | Tell the doctor about a health problem (a headache, a cold…). |
| `police` | Officer Davis (Police) | Ask how to get to a place in town (the hospital, the library…). |
| `teacher` | Ms. Taylor (Teacher) | Ask the teacher how to learn or practice English. |
| `firefighter` | Carlos (Firefighter) | Ask the firefighter about fire safety or his job. |
| `chef` | Marco (Chef) | Order a meal at the restaurant (pizza, pasta, soup…). |
| `banker` | Ms. Park (Banker) | Ask Ms. Park about saving money or opening a bank account. |
| `postman` | Sam (Postman) | Send a letter or a parcel (ask Sam for a stamp). |
| `hotelclerk` | Sofia (Hotel Clerk) | Book a room at the Hotel (say how many nights). |
| `priest` | Father Joe (Priest) | Ask Father Joe about the church or the history of the town. |
| `cinema` | Zoe (Cinema) | Buy a movie ticket (say which movie or seat you want). |
| `etmaster` | Mr. Reed (Station Master) | Ask which platform the next train leaves from. |
| `etclerk` | Emma (Ticket Clerk) | Ask Emma for a ticket (say where you want to go). |
| `etporter` | Leo (Porter) | Ask Leo to help you with your bag or parcel. |
| `rook` | Rook (Wandering Sketcher) | Ask Rook about the strange star mark and tell him what mural you'd like. |

## How V77 reflects the world (without changing it)

- **Conversation Replay** reads each resident's `mem[id].transcript` (the base game's
  own record) and the NPC display names learned from the live scene. It adds a notebook
  (`v77.favorites`) but never edits the transcript or affinity.
- **Cultural Passport** reads `v60.regions/echoes/artifacts/people` and the resident
  `goalDone` flags (via `v77.helped`) to decide stamps. It writes only `v77.passport`.
- **The LifeQuest Herald** compiles articles from `v60.events` (the world's own recorded
  event log). It invents nothing; if there are no events, it says so honestly.

## Preserved constraints

- No lore, character name, or region position was changed.
- The map is not fully unlocked; original gating remains.
- The original pixel-art NPC sprite style is untouched.
- No addictive/pressure mechanics were added; stamps are reflective rewards, not
  streaks, timers, or FOMO.