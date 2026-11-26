# Big Hero 6 image sourcing guide

There are 27 image slots. 23 are used on the site; `aunt-cass`, `san-fransokyo-day`, `san-fransokyo-night` and `sfit-lab` are not needed right now. Save each file in `public/assets/bh6/` using the **exact file name** below.
Then run:

```bash
npm run assets:process
```

This backs up the original to `assets-src/bh6/`, removes plain backgrounds, trims and resizes the
image, and marks the slot as real. Check progress at **/admin/assets** (✅ = in place).

## Search tips
- In Google Images, use **Tools → Color → Transparent** to find cutouts with no background. Many images
  that look transparent actually have a grey-and-white checkerboard baked in. Open the file and check
  before saving.
- Use **Tools → Size → Large** for anything shown big.
- Save the original file, not a thumbnail, and avoid images with watermarks or logos on them.
- Record the page each image came from in `public/assets/CREDITS.md`.
- If an image has a busy background, `assets:process` can't cut it out cleanly. Run it through a
  background remover (remove.bg or `rembg i in.png out.png`) first.

## Characters
Transparent PNG, at least 1200px tall, full body unless noted, one character per image.

| File | What it should show | Search |
|---|---|---|
| `baymax-healthcare.png` | White Baymax, standing, facing the camera, arms relaxed. **Hero image in light mode**, so pick the best one. | `Baymax PNG transparent full body front` |
| `baymax-wave.png` | White Baymax waving one hand (the "Hello" pose) | `Baymax waving PNG transparent` |
| `baymax-armor.png` | Baymax in red armour with purple trim, standing heroic, facing the camera. **Hero image in dark mode.** | `Baymax armor PNG transparent full body` |
| `baymax-armor-flying.png` | Armoured Baymax flying, **side view**, horizontal, arms forward. A wide image (about 1600×900) is fine. The flame is added in code. | `Baymax armor flying side view PNG` |
| `hiro.png` | Hiro Hamada in his purple and black hero suit, standing | `Hiro Hamada suit PNG transparent full body` |
| `tadashi.png` | Tadashi in his cap and cardigan, friendly pose | `Tadashi Hamada PNG transparent` |
| `honey-lemon.png` | Honey Lemon in her pink hero suit, ideally holding her purse or a chem ball | `Honey Lemon suit PNG transparent` |
| `gogo.png` | Go Go Tomago in her yellow suit, ideally with maglev discs | `Go Go Tomago suit PNG transparent` |
| `wasabi.png` | Wasabi in his green suit with plasma blades out | `Wasabi plasma blades PNG transparent` |
| `fred.png` | Fred in his blue kaiju suit | `Fred kaiju suit Big Hero 6 PNG transparent` |
| `callaghan.png` | Professor Robert Callaghan **unmasked** (glasses, grey hair, suit), not as Yokai | `Professor Callaghan Big Hero 6 PNG` |
| `yokai.png` | Yokai in the black coat and kabuki mask, ideally with a microbot swirl. This is the compulsory module, so pick a strong pose. | `Yokai Big Hero 6 PNG transparent` |
| `aunt-cass.png` | Aunt Cass, cheerful, waist-up is fine | `Aunt Cass Big Hero 6 PNG` |
| `team.png` | All six heroes together in suits. **Wide**, about 2000×1200 (used on the 404 page). | `Big Hero 6 team PNG transparent` |

## Props and objects
Transparent PNG, square-ish (about 800×800 or larger), object only with no hands or people.

| File | What it should show | Search |
|---|---|---|
| `microbot.png` | **One** black microbot, top or ¾ view. Simple is best: it's shrunk to a few pixels for the swarm. | `Big Hero 6 microbot PNG` |
| `kabuki-mask.png` | Yokai's white-and-red kabuki mask, front view, mask only | `Yokai mask PNG transparent` |
| `honey-lemon-purse.png` | Honey Lemon's yellow chem purse, front view | `Honey Lemon purse PNG` |
| `chem-ball.png` | One chem ball (pink, yellow or blue sphere) | `Honey Lemon chem ball PNG` |
| `maglev-disc.png` | One of Go Go's yellow maglev discs, ideally slightly tilted | `Go Go maglev disc PNG` |
| `plasma-blade.png` | One of Wasabi's glowing green plasma blades | `Wasabi plasma blade PNG` |
| `fred-kaiju-head.png` | The head of Fred's kaiju suit only | `Fred kaiju head Big Hero 6 PNG` |
| `tadashi-cap.png` | Tadashi's baseball cap, side or ¾ view | `Tadashi cap PNG` |
| `baymax-charging-case.png` | Baymax's red charging box | `Baymax charging station PNG` |
| `mochi.png` | Mochi the orange-and-white cat, ideally sitting or peeking | `Mochi cat Big Hero 6 PNG transparent` |

## Backgrounds
JPG, landscape, **at least 2400px wide**, no text or logos on top.

| File | What it should show | Search |
|---|---|---|
| `san-fransokyo-day.jpg` | San Fransokyo skyline by day, with the Golden Gate–style bridge with torii towers if possible | `San Fransokyo skyline day wallpaper 4K` |
| `san-fransokyo-night.jpg` | San Fransokyo at night with lanterns, blimps and city lights | `San Fransokyo night wallpaper 4K` |
| `sfit-lab.jpg` | SFIT robotics lab or Hiro's garage workshop interior | `SFIT lab Big Hero 6 wallpaper` |

## Where to start
The current homepage only uses a few of these, so begin with the ones that show most:

1. `baymax-healthcare.png` and `baymax-armor.png`: the homepage hero
2. `baymax-wave.png`: the registration guide (the fist bump is animated in code)
3. `honey-lemon-purse.png`: the payment step
4. `baymax-armor-flying.png`: the scroll indicator
5. The nine module characters (`hiro`, `tadashi`, `honey-lemon`, `gogo`, `wasabi`, `fred`, `callaghan`,
   `yokai`, plus Baymax): the module pages and card hover avatars

Until a slot has its real file, the live site hides it or shows a small icon. Add `?debug=assets` to any
page URL to see the labelled placeholders.

## Not used anymore
- `baymax-fistbump.png`: removed. The fist bump is animated in code.
- `lucky-cat.png`: removed. The footer egg is a text reveal ("Lucky Cat Café: now serving science").
