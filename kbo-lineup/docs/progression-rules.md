# Classic progression rules

These are this fan game's public settings, not official Com2uS probabilities.

- Cards begin at Lv.1, cap 10. Each successful enhancement adds one level and distributes five points independently among the five stats. Stats have no final ceiling. Point success: 100% at Lv.1, minus 4 percentage points per level, minimum 10%; star enhancement is guaranteed. Point/star costs are current level × 3,000/50.
- Five limit breaks raise cap by two to 20. Each uses one exact season/type/grade duplicate plus the shown point/star fee, or one limit-break ticket. Both guarantee success. Current level stays unchanged.
- Five transcend breaks raise cap to 22/24/26/28/30, costing 1/2/3/4/5 transcend tickets. Tickets cost 1,000 stars in the shop. Current level stays unchanged.
- Batters use contact, power, eye, speed, field. Pitchers use control, stuff, stamina, fastball, breaking. Fastball and breaking are game estimates derived from season statistics, not measured pitch velocities or pitch-specific records. OVR is the rounded mean of five base+growth stats, excluding deck and skill effects. Legacy upgrades and growth remain as stat additions on migration.
- Signature targets must be platinum, with no level requirement. MVP/Golden Glove targets require five cards with one chosen stat >=95. Normal/national/all-star targets require ten qualifying cards and a separate actual MVP/Golden Glove card without a stat requirement. A contract and 100,000 points are also consumed. At most two stat slots accept wildcards. Signature/legend, assigned, or registered cards cannot be materials.
- Normal scouts: 3,000 points, N50/R25/SP18/H6/P1%. Advanced scouts: 100 stars, SP60/H30/P10%. Both grant a player immediately.
- Legend scouts consume a scout ticket (shop: 20,000 stars) and add a candidate, not a player. Choose home venue: home franchise 45%, all other franchises 55%; draw uniformly within each pool. LG Jamsil and Doosan Jamsil are separate. Hyundai is not treated as Kiwoom for this draw. Venues lacking home legends cannot run legend searches.
- Queue begins with one slot. Eleven purchases of 500 stars each raise it to twelve. Deleting candidates never releases registered materials.
- Each legend's independent recipe book holds twelve slots: six exact player seasons, own-franchise all-star/MVP/GG, own-franchise verified national card, two exact coaches. Preregistration is irreversible and locks the asset immediately. At most two award/national slots accept uniquely reserved wildcards. Final recruitment requires a matching discovered candidate, all twelve registered assets, and 1,000,000 points; consumes all twelve and the candidate. There is no recruitment permit.
- Existing permits and pending permit mail convert 1:1 to scout tickets. Existing scout candidates and pledges migrate into queue/books. Future season completion grants five premium skill tickets instead of permits, plus the other existing rewards. Test resource refill remains explicit and separate.
- Ordinary/select/protect skill grades: N30/H40/P30%, capped at HERO below platinum. Select excludes its previous name. No set contains duplicate names. Premium on legend cards: each slot independently has a 35% legend chance; first otherwise guarantees platinum, other slots otherwise use N30/H40/P30%. Nonlegend cards cannot roll legend skills. Premium still offers old/new set selection.

Core implementations: `growth-rules.js`, `classic-progression.js`, `scouting-rules.js`, `club-rules.js`. Confirmations precede irreversible registrations and final recruitment. All validation runs before committing resources.

## Pitching staff

Five starters rotate in order. Six bullpen slots are fixed: winning group 1/2, chasing group 1/2, long relief, closer. Lineups require eleven distinct pitchers. Starter squads and AI teams include all eleven. Legacy three-slot bullpens retain the former middle/setup pair as the winning pair and the former closer as the closer; only the three new slots are filled from eligible owned reserves. Registered materials and duplicate players are skipped, and insufficient reserves leave visible empty slots.

Games prefer the winning pair in close leads/ties, chasing pair while narrowly trailing, long relief for early starter removal, large margins and extras, and the closer for a lead of at most three runs in the ninth or later. A removed pitcher cannot reenter; long relief may stay for two innings, and an exhausted bullpen keeps its current pitcher. Game results include an inning-by-inning role log. Existing card stats, ownership and currencies are preserved.

## Five batting reserves

The lineup has nine starting batters, five batting bench slots, and eleven pitchers (25 registered players). Starter gifts remain 26 owned cards and now include at least fourteen distinct batters. Existing saves fill new bench slots from eligible unassigned owned batters once, without creating or consuming cards. Missing reserves may stay empty and do not block league play.

Bench cards are protected from release, combination and scout materials and count for team/year deck bonuses. Selecting a bench card and then an eligible starting batter swaps their assignments, preserving the batting-order position and all card growth. A direct upgrade to another card of the currently starting player is still allowed from owned cards. Duplicate players across starting and bench slots, pitchers on the batting bench, false field positions and registered scout materials are rejected. Bench editing is pregame; this change does not enable automatic in-game pinch hitting.

## Legend positions and set decks

Legend game positions: Jang Jong-hoon 1B/SS; Yang Joon-hyuk 1B/RF; Jang Hyo-jo LF; Lee Soon-cheol CF; Baek In-cheon LF; Jeon Jun-ho CF; Hong Sung-heun C/DH; Jang Sung-ho 1B/LF; Lee Dae-ho 1B/3B. Original season stats and recorded season positions remain in metadata; owned cards and waiting candidates update their game positions without consuming or rerolling anything. The existing outfield compatibility rule remains.

Every LEGEND card counts once toward the strongest ordinary-card year deck regardless of its recorded season. An all-legend lineup displays “all years”. Legend card faces omit the year; the source-stat year remains in player details and recipes. Club decks group Haitai/KIA, OB/Doosan, Binggrae/Hanwha, MBC/LG, SK/SSG and Woori/Nexen/Heroes/Kiwoom while retaining original club names on cards. Hyundai is not grouped with Kiwoom. Club, year and national bonuses continue stacking using the existing thresholds.
