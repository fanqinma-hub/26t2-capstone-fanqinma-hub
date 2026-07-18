# Role 2 scene asset provenance

> Scope: private Role 2 development assets and fixtures for Activities 2–5.
> This record does not assert copyright ownership and does not change the
> shared activity contract or production route orchestration.

## Workbook source

- Supplied workbook: `Team ALMOND TASKS.xlsx`
- SHA-256: `d92f84b4a77c9b6cbe06eeb00d3c7ba3731419ca33416e599c54f8efd5887f8c`
- Size: 15,832,729 bytes
- Sheets read in full: `General`; `Tech stack`; `Learning unit6- S Initial
  Sound`; `Tasks Description`; `Learning unit details`; `Progress Report
  sample`.
- Activity 2–5 development dialogue in
  `src/fixtures/role2-activity-scenes.fixture.ts` is transcribed verbatim from
  `Learning unit details`. Child-facing preview state strings are private
  development scaffolding, not a public content contract.

All 18 embedded workbook images were extracted for comparison during review.
The three supplied task attachments matched the Activity 3, 4 and 5 workbook
images visually; the repository copies below use the supplied attachment
bytes.

## Scene files

| Activity | File | Pixels | Intended frame | SHA-256 | Status |
| ---: | --- | ---: | --- | --- | --- |
| 3 | `assets/client/scenes/activity-03.png` | 1402×1122 | 5:4, contain | `db26b63dc36d82474f18ec231394013dd5393f5945f629659754d209a6d6d527` | Original bytes preserved |
| 4 | `assets/client/scenes/activity-04-original.png` | 1402×1122 | 5:4, contain | `c059f8ac339e60f571a2f151ffdd16515d56618ffdd1233fbed579543fe14ea2` | Original bytes preserved |
| 5 | `assets/client/scenes/activity-05.png` | 1536×1024 | 3:2, contain | `eff553ba235fa03beb9894afc8da9e9d5924c455bc8bcea2591bf2f2885fee82` | Original bytes preserved |

The 1402×1122 files differ from exact 5:4 by two source pixels. The preview
uses a 5:4 frame with `contain`, so it neither crops nor stretches the source.
Activity 5 is exact 3:2.

## Target visibility and answer leakage

| Activity | Targets | Visibility / leakage decision |
| ---: | --- | --- |
| 2 | gum tree, yellow flower, golden dog, bird | Objects are visible without text labels. Size contrast is instructional visual evidence, not a printed answer. |
| 3 | teddy bear, toy car, bookshelf | All targets are unobscured and unlabeled. Their deliberately contrasting scale is required by the supplied scene. |
| 4 | three pumpkins, bananas, grapes | The client-approved original is used unchanged. Its `BIG`, `MEDIUM` and `SMALL` pumpkin placards are intentional visible scene content. Produce and target geometry remain unobscured. |
| 5 | wave, sandcastle, shell, umbrella, crab, rock | All targets are visible and unlabeled. The scene provides visual scale only. |

Normalized focus rectangles, checksums, source notes and descriptive
accessibility labels live in the private
`src/components/activity/dev/role2-scene-manifest.ts`. Shared spotlight geometry
in `src/components/activity/spotlight-geometry.ts` dims only the complement of
the displayed focus region, so target pixels are never covered by the focus
overlay. Activity 1 now consumes the same complement geometry instead of
drawing only a border over an otherwise unchanged scene.

Non-overlapping targets retain separate borders and compact intersecting
comparisons use one union border. Activity 5's formal fixture follows only its
prompt-specific focus states: wave, sandcastle, and shell + crab. Its retry
retains shell + crab as the last real clue instead of showing an empty scene or
inventing an umbrella retry. Spotlight phases never extend conversation state
timers. The large-overlap wave → sandcastle → umbrella → union sequence remains
available only in a labelled, deterministic geometry QA panel with explicit
phase controls; it is not part of the child activity flow.
