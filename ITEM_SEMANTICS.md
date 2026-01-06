# Item Description Semantics (German)

This document defines the **exact German phrasing** for item descriptions to ensure consistent, readable text across all items and relics.

---

## Grammar Structure

Every item description follows this rigid order:

> **WANN** (Trigger) → **WENN** (Condition) → **WAS** (Effect) → **WIE OFT** (Limit)

Example:

> **Beim ersten Wurf jeder Hand:** +1 Mult. _(1× pro Hand)_

---

## Trigger Phrasing (WANN)

Use these exact phrases for each trigger type:

### Run Triggers

| Trigger ID     | German Copy                        | Example                                       |
| -------------- | ---------------------------------- | --------------------------------------------- |
| `RUN_START`    | **Beim Start eines Runs:**         | Beim Start eines Runs: Erhalte +10$.          |
| `RUN_END`      | **Am Ende eines Runs:**            | Am Ende eines Runs: Bonus basierend auf Geld. |
| `ITEM_GAINED`  | **Beim Erhalten dieses Relikts:**  | Beim Erhalten dieses Relikts: +1 Hand-Level.  |
| `ITEM_REMOVED` | **Beim Verlieren dieses Relikts:** | Beim Verlieren dieses Relikts: Verliere 5$.   |

### Level Triggers

| Trigger ID           | German Copy                      | Example                                          |
| -------------------- | -------------------------------- | ------------------------------------------------ |
| `LEVEL_START`        | **Beim Start eines Levels:**     | Beim Start eines Levels: +1 Wurf pro Hand.       |
| `LEVEL_WON`          | **Beim Erreichen des Ziels:**    | Beim Erreichen des Ziels: +5$.                   |
| `LEVEL_RESULT_ENTER` | **Beim Anzeigen der Belohnung:** | Beim Anzeigen der Belohnung: Verdopple Bonus.    |
| `SHOP_ENTER`         | **Beim Betreten des Shops:**     | Beim Betreten des Shops: +2$ pro 5$ (max 10$).   |
| `SHOP_EXIT`          | **Beim Verlassen des Shops:**    | Beim Verlassen des Shops: +1 zufälliges Upgrade. |

### Hand Triggers

| Trigger ID              | German Copy                        | Example                                         |
| ----------------------- | ---------------------------------- | ----------------------------------------------- |
| `HAND_START`            | **Beim Start einer Hand:**         | Beim Start einer Hand: Alle Würfel entsperren.  |
| `HAND_FIRST_ROLL_START` | **Beim ersten Wurf jeder Hand:**   | Beim ersten Wurf jeder Hand: +1 Mult.           |
| `HAND_LAST_ROLL_START`  | **Beim letzten Wurf jeder Hand:**  | Beim letzten Wurf jeder Hand: +20 Punkte.       |
| `HAND_ACCEPTED`         | **Wenn die Hand angenommen wird:** | Wenn die Hand angenommen wird: Sperre alle 6er. |
| `HAND_SCORED`           | **Nach der Handwertung:**          | Nach der Handwertung: +1$.                      |

### Roll Triggers

| Trigger ID         | German Copy                                | Example                                        |
| ------------------ | ------------------------------------------ | ---------------------------------------------- |
| `ROLL_COMMIT`      | **Vor dem Würfeln:**                       | Vor dem Würfeln: 10% Chance auf +1 Wurf.       |
| `ROLL_SETTLED`     | **Nach dem Würfeln:**                      | Nach dem Würfeln: Wenn 3+ gleiche, +10 Punkte. |
| `DIE_LOCK_TOGGLED` | **Beim Sperren/Entsperren eines Würfels:** | Beim Sperren eines Würfels: +5 Punkte.         |

**Note for `DIE_LOCK_TOGGLED`:** Use more specific phrasing based on the condition:

- **Beim Sperren eines Würfels:** — When locking
- **Beim Entsperren eines Würfels:** — When unlocking
- **Beim Sperren/Entsperren eines Würfels:** — Both

### Scoring Triggers

| Trigger ID      | German Copy                 | Example                                           |
| --------------- | --------------------------- | ------------------------------------------------- |
| `SCORE_PRECALC` | **Vor der Wertung:**        | Vor der Wertung: Wenn Full House, Mult ×2.        |
| `SCORE_PER_DIE` | **Beim Zählen pro Würfel:** | Beim Zählen pro Würfel: Jeder 6er gibt +5 Punkte. |
| `SCORE_APPLIED` | **Nach der Wertung:**       | Nach der Wertung: Wenn genau 2 Einsen, +1 Mult.   |

### Economy Triggers

| Trigger ID            | German Copy                    | Example                                       |
| --------------------- | ------------------------------ | --------------------------------------------- |
| `SHOP_GENERATE_OFFER` | **Beim Generieren des Shops:** | Beim Generieren des Shops: +1 Relikt-Auswahl. |
| `SHOP_PURCHASE`       | **Beim Kaufen eines Items:**   | Beim Kaufen eines Items: 20% Cashback.        |
| `MONEY_GAIN`          | **Wenn Geld erhalten wird:**   | Wenn Geld erhalten wird: +10% extra.          |
| `MONEY_SPEND`         | **Wenn Geld ausgegeben wird:** | Wenn Geld ausgegeben wird: 1$ sparen.         |

---

## Condition Phrasing (WENN)

Conditions come **after** the trigger and **before** the effect. Use these patterns:

### Dice Conditions

| Condition              | German Copy                   |
| ---------------------- | ----------------------------- |
| Specific value present | wenn mindestens ein 6er,      |
| Exact count of value   | wenn genau 2 Einsen,          |
| All same value         | wenn alle Würfel gleich,      |
| No specific value      | wenn kein 1er,                |
| X or more of value     | wenn 3+ Sechser,              |
| Locked dice count      | wenn genau 2 Würfel gesperrt, |
| Sum condition          | wenn die Summe ≥20,           |

### Hand Conditions

| Condition            | German Copy         |
| -------------------- | ------------------- |
| Specific hand type   | wenn Full House,    |
| Upper section        | wenn oberer Block,  |
| Lower section        | wenn unterer Block, |
| Hand level condition | wenn Hand-Level ≥3, |

### Game State Conditions

| Condition       | German Copy                  |
| --------------- | ---------------------------- |
| Money condition | wenn Geld ≥20$,              |
| Score condition | wenn Punktzahl ≥100,         |
| Remaining hands | wenn letzte Hand des Levels, |
| Level index     | wenn Level ≥5,               |

### Combined Example

> **Nach dem Würfeln, wenn genau 2 Würfel gesperrt:** +20 Punkte.

---

## Effect Phrasing (WAS)

Effects should be short and direct:

### Scoring Effects

| Effect Type   | German Copy | Example    |
| ------------- | ----------- | ---------- |
| Add points    | +X Punkte   | +10 Punkte |
| Add mult      | +X Mult     | +1 Mult    |
| Multiply mult | Mult ×X     | Mult ×2    |
| Add pips      | +X Pips     | +3 Pips    |

### Roll Effects

| Effect Type | German Copy                | Example             |
| ----------- | -------------------------- | ------------------- |
| Extra roll  | +X Wurf / +X Würfe         | +1 Wurf             |
| Refund roll | Wurf wird nicht verbraucht | —                   |
| Reroll dice | Würfle X Würfel neu        | Würfle 2 Würfel neu |

### Dice Manipulation

| Effect Type    | German Copy              | Example                  |
| -------------- | ------------------------ | ------------------------ |
| Set die value  | Setze einen Würfel auf X | Setze einen Würfel auf 6 |
| Bump die value | Ein Würfel +1 (max 6)    | Höchster Würfel +1       |
| Lock die       | Sperre einen Würfel      | Sperre alle 6er          |
| Unlock die     | Entsperre einen Würfel   | Entsperre alle           |

### Economy Effects

| Effect Type | German Copy         | Example                |
| ----------- | ------------------- | ---------------------- |
| Add money   | +X$                 | +5$                    |
| Lose money  | −X$ / Verliere X$   | −3$                    |
| Discount    | X$ Rabatt auf Y     | 2$ Rabatt auf Upgrades |
| Interest    | +X$ pro Y$ (max Z$) | +2$ pro 5$ (max 10$)   |
| Cashback    | X% Cashback         | 20% Cashback           |

### Meta Effects

| Effect Type     | German Copy                 | Example                     |
| --------------- | --------------------------- | --------------------------- |
| Upgrade hand    | +X Hand-Level für Y         | +1 Hand-Level für Straße    |
| Add enhancement | +1 Punkte-Pip / +1 Mult-Pip | +1 Punkte-Pip auf einem 6er |

---

## Limiter Phrasing (WIE OFT)

Limits appear in parentheses at the end:

| Limiter Type | German Copy            | Example                |
| ------------ | ---------------------- | ---------------------- |
| Per hand     | (X× pro Hand)          | (1× pro Hand)          |
| Per level    | (X× pro Level)         | (2× pro Level)         |
| Per shop     | (X× pro Shop)          | (1× pro Shop)          |
| Charges      | (X Ladungen)           | (3 Ladungen)           |
| Cooldown     | (Abklingzeit: X Hände) | (Abklingzeit: 2 Hände) |
| Per run      | (Einmalig pro Run)     | (Einmalig pro Run)     |

---

## Scaling Phrasing

For effects that scale based on conditions:

| Scaling Type         | German Copy           |
| -------------------- | --------------------- |
| Per locked die       | pro gesperrtem Würfel |
| Per die with value X | pro Xer               |
| Per hand level       | pro Hand-Level        |
| Per $ held           | pro X$                |
| Per used hand        | pro verwendeter Hand  |

**Example:**

> **Vor der Wertung:** +10 Punkte pro gesperrtem Würfel.

---

## Target Phrasing

When targeting specific dice or hands:

### Dice Targets

| Target            | German Copy           |
| ----------------- | --------------------- |
| All dice          | alle Würfel           |
| Locked dice       | gesperrte Würfel      |
| Unlocked dice     | ungesperrte Würfel    |
| Random die        | ein zufälliger Würfel |
| Highest die       | höchster Würfel       |
| Lowest die        | niedrigster Würfel    |
| Dice with value X | alle Xer              |
| Contributing dice | beitragende Würfel    |

### Hand Targets

| Target        | German Copy   |
| ------------- | ------------- |
| Selected hand | gewählte Hand |
| Upper section | oberer Block  |
| Lower section | unterer Block |
| Specific hand | [Handname]    |

---

## Complete Examples

Here are full item descriptions following all conventions:

### Common Items

```
Glückliche Sechs
Beim Zählen pro Würfel: Jeder 6er gibt +5 Punkte.

Erstlingsglück
Beim ersten Wurf jeder Hand: +1 Mult. (1× pro Hand)

Letzte Chance
Beim letzten Wurf jeder Hand: +20 Punkte.

Trinkgeldglas
Nach der Handwertung: +1$.
```

### Uncommon Items

```
Schlangenaugen
Nach der Wertung: Wenn genau 2 Einsen, +1 Mult.

Volle Sperre
Vor der Wertung: +10 Punkte pro gesperrtem Würfel.

Sparschwein
Beim Betreten des Shops: +2$ pro 5$ (max 10$).

Siegesserie
Beim Erreichen des Ziels: +5$.
```

### Rare Items

```
Sechserschütze
Vor der Wertung: +2 Mult pro 6er in der Hand.

Double Down
Vor der Wertung: Wenn Full House, Mult ×2.

Extradrehung
Beim Start eines Levels: +1 Wurf pro Hand.
```

### Legendary Items

```
Sechser-Baum
Beim Start eines Runs: Jeder 6er zählt als zwei. (Einmalig pro Run)

Goldener Würfel
Beim Zählen pro Würfel: +5 Punkte und +1 Mult. (3 Ladungen)
```

---

## Formatting Rules

1. **Trigger phrase ends with colon** — `Beim Start eines Levels:`
2. **Condition uses comma** — `wenn Full House,`
3. **Effect is direct** — `+10 Punkte` or `Mult ×2`
4. **Period after effect** — `+10 Punkte.`
5. **Limiter in parentheses** — `(1× pro Hand)`
6. **No trailing period after limiter**
7. **Numbers with +/− prefix** — `+5 Punkte`, `−3$`
8. **Multipliers use ×** — `Mult ×2` (not `x2`)
9. **Money uses $** — `+5$`, `pro 5$`

---

## Word Bank

### Verbs

| German     | Meaning   |
| ---------- | --------- |
| gibt       | gives     |
| erhalte    | receive   |
| verliere   | lose      |
| verdopple  | double    |
| würfle neu | reroll    |
| sperre     | lock      |
| entsperre  | unlock    |
| zählt als  | counts as |
| setze auf  | set to    |

### Nouns

| German       | Meaning        |
| ------------ | -------------- |
| Würfel       | die/dice       |
| Wurf / Würfe | roll/rolls     |
| Hand         | hand (attempt) |
| Punkte       | points         |
| Mult         | multiplier     |
| Pips         | pips           |
| Level        | level          |
| Run          | run            |
| Relikt       | relic/item     |
| Ladung/en    | charge/s       |
| Abklingzeit  | cooldown       |

### Prepositions & Conjunctions

| German | Meaning          |
| ------ | ---------------- |
| beim   | at (the time of) |
| vor    | before           |
| nach   | after            |
| wenn   | if/when          |
| pro    | per              |
| auf    | on/to            |
| für    | for              |
| und    | and              |

---

## Quick Reference Card

```
TRIGGER:
  Beim [Start/Ende] eines [Runs/Levels/Hand]:
  Beim [ersten/letzten] Wurf jeder Hand:
  Vor/Nach dem Würfeln:
  Vor/Nach der Wertung:
  Beim Zählen pro Würfel:
  Beim Betreten/Verlassen des Shops:
  Wenn [Geld/Hand] [erhalten/angenommen] wird:

CONDITION:
  wenn [Full House/Straße/etc.],
  wenn [genau X/mindestens X/X+] [Einsen/Sechser/etc.],
  wenn [X] Würfel gesperrt,
  wenn [Bedingung],

EFFECT:
  +X Punkte / +X Mult / Mult ×X
  +X$ / −X$
  +X Wurf/Würfe
  Sperre/Entsperre [Ziel]

LIMIT:
  (X× pro Hand/Level/Shop)
  (X Ladungen)
  (Abklingzeit: X Hände)
```
