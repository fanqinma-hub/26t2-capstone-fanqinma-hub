# FunWattle brand assets

All assets in this manifest were supplied by the client. Repository copies do
not include local source paths, Drive links, or tool metadata.

## Direct copies

| Original filename | Repository filename | Dimensions | Handling | Intended use |
| --- | --- | --- | --- | --- |
| `Copy of Logo1.png` | `assets/brand/logos/funwattle-logo.png` | 1438 × 431 | Direct copy | Compact headers |
| `Copy of FunWattle_Logo_tagline.png` | `assets/brand/logos/funwattle-logo-tagline.png` | 1313 × 394 | Direct copy | Entry page |
| `Copy of FunWattle platform color codes.jpeg` | `assets/brand/reference/funwattle-colour-reference.jpeg` | 695 × 1338 | Direct copy | Documentation/reference only |
| `FunWattle Mascot - Kool the Koala.png` | `assets/brand/reference/kool-character-sheet.png` | 1414 × 2000 | Direct copy | Documentation/reference only; never rendered in-app |

The four direct copies were SHA-256 verified against the supplied originals at
import time.

## Derived runtime poses

| Repository filename | Source pose on client sheet | Handling | Intended use |
| --- | --- | --- | --- |
| `assets/brand/kool/kool-idle.png` | NEUTRAL | Deterministic crop with connected near-white background removal | Waiting/ready dialogue |
| `assets/brand/kool/kool-wave.png` | Large wave character | Deterministic crop with connected near-white background removal | Home/entry greeting |
| `assets/brand/kool/kool-speaking.png` | SPEAKING | Deterministic crop with connected near-white background removal | Spoken prompt |
| `assets/brand/kool/kool-listening.png` | LISTENING | Deterministic crop with connected near-white background removal | Listening state |
| `assets/brand/kool/kool-thinking.png` | THINKING | Deterministic crop with connected near-white background removal | Processing state |
| `assets/brand/kool/kool-retry.png` | PRACTICE (REPEAT) | Deterministic crop with connected near-white background removal | Gentle retry |
| `assets/brand/kool/kool-success.png` | CELEBRATE | Deterministic crop with connected near-white background removal | Success state |
| `assets/brand/kool/kool-breathe.png` | BREATHE IN | Deterministic crop with connected near-white background removal | Breathing cue |

Run `node scripts/asset-tools/extract-kool-poses.js` to regenerate the derived
files. The crop tool uses hand-reviewed source coordinates, removes only the
reference-sheet background/layout regions, and adds transparent safety padding
around each pose. To visually inspect every pose without committing an artifact,
run `node scripts/asset-tools/extract-kool-poses.js --contact-sheet
/private/tmp/funwattle-kool-poses-contact-sheet.png`; the sheet renders each
pose over white, dark, and checkerboard backgrounds. The runtime UI keeps the
smaller sheet crops at a modest display size; the higher-resolution wave crop
is used for the large entry-page mascot.
