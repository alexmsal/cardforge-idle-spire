# CardForge: Idle Spire — Data Package v1.0

## Files

| File | Contents |
|------|----------|
| `cards.json` | 50 MVP cards with full PP budget calculations |
| `enemies.json` | 10 Crypt enemies (6 normal, 3 elite, 1 boss) |
| `game-config.json` | Events, shop, starter deck, dungeon map, economy, combat config |
| `CardForge_Prototype_Plan.md` | Full development plan with phases and estimates |

---

## Cards Summary (50 total)

### By Rarity
| Rarity | Count | PP Budget | Energy Range |
|--------|-------|-----------|-------------|
| Common | 30 | 4 PP | 0–2 |
| Uncommon | 15 | 7 PP | 0–2 |
| Rare | 5 | 11 PP | 0–3 |

### By Archetype
| Archetype | Common | Uncommon | Rare | Total | Key Mechanic |
|-----------|--------|----------|------|-------|-------------|
| Neutral | 12 | 6 | 2 | 20 | Versatile basics |
| Berserker | 6 | 3 | 1 | 10 | STR stacking, self-damage |
| Poison | 6 | 3 | 1 | 10 | Poison stacks, debuffs |
| Shield | 6 | 3 | 1 | 10 | Block, Thorn, DEX |

### Key Cards per Archetype

**Berserker payoffs:** Flex (temp STR), Berserk (perm STR + self-vuln), Rampage (scaling damage), Demon Form (STR/turn)

**Poison payoffs:** Envenom (raw stacks), Catalyst (double poison), Corpse Explosion (AoE on death), Crippling Poison (dual debuff)

**Shield payoffs:** Iron Bastion (block+thorn), Barricade (block doesn't decay), Impregnable (block+thorn+DEX), Reflect (thorn burst)

**Neutral staples:** Strike, Defend, Healing Potion, Adrenaline (draw+energy), Offering (massive draw at HP cost)

---

## Enemies Summary (10 total)

### Normal (6)
| Enemy | Base HP | Base ATK | Floors | Key Mechanic |
|-------|---------|----------|--------|-------------|
| Skeleton | 28 | 7 | 1–5 | Simple cycle: ATK/ATK/Block |
| Shambling Corpse | 40 | 5 | 1–6 | Gains STR every 4 turns |
| Phantom | 22 | 9 | 3–8 | Applies Weakness, glass cannon |
| Bone Archer | 25 | 6 | 2–7 | Multi-hit volley (3×3) |
| Crypt Rat | 18 | 4 | 4–10 | Spawns in groups (2–3), poisons player |
| Necro Acolyte | 30 | 5 | 5–10 | Buffs all enemies (+3 ATK) |

### Elite (3)
| Enemy | Base HP | Base ATK | Floor | Key Mechanic |
|-------|---------|----------|-------|-------------|
| Bone Golem | 65 | 10 | 3 | Tank, Bone Storm (ATK+Block combo) |
| Crypt Wraith | 55 | 12 | 6 | Lifesteal, Weakness, burst hit |
| Lich Apprentice | 70 | 8 | 9 | Summons skeletons, poisons player |

### Boss (1)
| Enemy | Base HP | Base ATK | Floor | Phases |
|-------|---------|----------|-------|--------|
| The Crypt Lord | 180 | 12 | 10 | 2 phases (50% HP transition) |

**Phase 1 (The Tyrant):** ATK / Block / ATK / Weakness+ATK / Multi-hit (4×4)
**Phase 2 (The Undying):** +3 STR transition → Heavy ATK / Summon 2 skeletons / Lifesteal ATK / Block+ATK combo

---

## Events (5)
1. **Forgotten Altar** — Blood (HP → card) / Gold (gold → heal) / Leave
2. **Wandering Merchant** — Buy rare (150g) / Card removal (50g) / Gamble
3. **Cursed Chest** — Force open (HP → rare) / Disarm (harder next floor → uncommon) / Leave
4. **Training Dummy** — Free card upgrade / Practice fight for gold
5. **Mysterious Pool** — Drink (random effect) / Dip card (transform) / Leave

## Shop
- 3 random cards (50/100/200g by rarity)
- Card removal: 75g
- Healing Flask: 50g (heal 20 HP)

## Starter Deck (15 cards)
4× Strike, 4× Defend, 1× Bash, 1× Healing Potion, 2× Quick Slash, 1× Shield Bash, 1× Iron Wave, 1× Bandage

**Pre-configured AI (3 rules):**
1. IF HP < 30% → Healing Potion
2. IF Block = 0 → Defend
3. ALWAYS → Strike nearest

---

## Balance Design Notes

### Archetype Matchups vs Crypt Lord (Boss)
- **Berserker:** Burns Phase 1 fast. Weakness from Oppressive Strike slows Phase 2. Needs raw damage or vulnerability cards.
- **Poison:** Ignores block (Wall of Bones, Bone Fortress). Catalyst before Phase 2 transition is key timing. Safest against lifesteal since poison is passive.
- **Shield:** Thorn procs on multi-hits (Bone Barrage, Phase 2 attacks). Barricade + high block tanks Soul Harvest. Slowest win but most consistent.

### Enemy Design Principles
- Floors 1–3: Learn patterns, predictable enemies, single targets
- Floors 4–6: Debuffs appear, multi-enemy fights increase, kill priority matters
- Floors 7–9: All mechanics active, Lich Apprentice creates most complex fight
- Floor 10: Boss tests all three archetypes with different Phase 2 strategies

### Economy Targets (from GDD)
- Average gold per floor: 15–25 (early), 40–60 (mid), 80–120 (late)
- Full Crypt run yields: ~500–800 gold, 1 rare+ card, ~40 shards (from dismantles)
- Station upgrade Level 1→2: 500g (1 run). Level 5→6: ~9,500g (~10–12 runs)

---

## Next Steps

All data is ready for implementation. Recommended coding order:

1. **BattleEngine** — Core combat loop with these cards and enemies
2. **AIEngine** — Rule evaluation using starter deck's 3 rules
3. **Simulator** — Run 100 battles, validate winrates per archetype
4. **DeckBuilder UI** — Card browser + AI editor
5. **DungeonRunner** — Map generation, events, shop, rest
6. **Workshop** — Crafting, stations, library
7. **Economy** — Gold/shard tracking, idle calculation
8. **Prestige** — Reforge cycle, foil, eternal card
9. **Onboarding** — Starter deck, tooltips, mini-tutorial
