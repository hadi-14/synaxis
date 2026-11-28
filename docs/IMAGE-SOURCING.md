# Big Hero 6 image sourcing guide

There are 21 image slots, all used on the site and all in place. Backgrounds (skyline, blueprint, HUD) are drawn in code, so no background images are needed. Save each file in `public/assets/bh6/` using the **exact file name** below.
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
| `hiro.png` | Hiro Hamada in his purple and black hero suit, standing | `Hiro Hamada suit PNG transparent full body` |
| `tadashi.png` | Tadashi in his cap and cardigan, friendly pose | `Tadashi Hamada PNG transparent` |
| `honey-lemon.png` | Honey Lemon in her pink hero suit, ideally holding her purse or a chem ball | `Honey Lemon suit PNG transparent` |
| `gogo.png` | Go Go Tomago in her yellow suit, ideally with maglev discs | `Go Go Tomago suit PNG transparent` |
| `wasabi.png` | Wasabi in his green suit with plasma blades out | `Wasabi plasma blades PNG transparent` |
| `fred.png` | Fred in his blue kaiju suit | `Fred kaiju suit Big Hero 6 PNG transparent` |
| `callaghan.png` | Professor Robert Callaghan **unmasked** (glasses, grey hair, suit), not as Yokai | `Professor Callaghan Big Hero 6 PNG` |
| `yokai.png` | Yokai in the black coat and kabuki mask, ideally with a microbot swirl. This is the compulsory module, so pick a strong pose. | `Yokai Big Hero 6 PNG transparent` |
| `team.png` | All six heroes together in suits. **Wide**, about 2000×1200 (used on the 404 page). | `Big Hero 6 team PNG transparent` |

## Props and objects
Transparent PNG, square-ish (about 800×800 or larger), object only with no hands or people.

| File | What it should show | Search |
|---|---|---|
| `microbot.png` | **One** black microbot, top or ¾ view. Simple is best: it's shrunk to a few pixels for the swarm. | `Big Hero 6 microbot PNG` |
| `kabuki-mask.png` | Yokai's white-and-red kabuki mask, front view, mask only | `Yokai mask PNG transparent` |
| `honey-lemon-purse.png` | Honey Lemon's yellow chem purse, front view | `Honey Lemon purse PNG` |
| `maglev-disc.png` | One of Go Go's yellow maglev discs, ideally slightly tilted | `Go Go maglev disc PNG` |
| `fred-kaiju-head.png` | Cropped from `fred.png` (head only, square, transparent). Re-crop if `fred.png` changes. | — |
| `tadashi-cap.png` | Tadashi's baseball cap, side or ¾ view | `Tadashi cap PNG` |
| `baymax-charging-case.png` | First frame of the charging GIF (the closed case). Also the poster for the video below. | — |
| `mochi.png` | Mochi the orange-and-white cat, ideally sitting or peeking | `Mochi cat Big Hero 6 PNG transparent` |


## Video
`public/assets/bh6/video/baymax-charging.{mp4,webm}` plus `-poster.jpg`: Baymax inflating out of his
charging case, converted from the team's GIF (original kept in `assets-src/bh6/`). Used for the Baymax
guide's first appearance on /register and on the registration success screen. To replace it, convert a
new GIF with the ffmpeg commands in the commit that added it (flatten onto `#F1F2F6`, 480px wide).

## Where to start
The current homepage only uses a few of these, so begin with the ones that show most:

1. `baymax-healthcare.png` and `baymax-armor.png`: the homepage hero
2. `baymax-wave.png`: the registration guide (the fist bump is animated in code)
3. `honey-lemon-purse.png`: the payment step (the scroll indicator's rocket fist is cut from `baymax-armor.png`)
4. The nine module characters (`hiro`, `tadashi`, `honey-lemon`, `gogo`, `wasabi`, `fred`, `callaghan`,
   `yokai`, plus Baymax): the module pages and card hover avatars

Until a slot has its real file, the live site hides it or shows a small icon. Add `?debug=assets` to any
page URL to see the labelled placeholders.

## Not used anymore
- `baymax-fistbump.png`: removed. The fist bump is animated in code.
- `lucky-cat.png`: removed. The footer badge is a code-drawn SVG beckoning cat.
- `chem-ball.png`, `plasma-blade.png`: removed. Drawn in code (`src/components/decor/CodeProps.tsx`).
- `aunt-cass.png`, `san-fransokyo-day.jpg`, `san-fransokyo-night.jpg`, `sfit-lab.jpg`: removed. Skyline, blueprint, hex and HUD backgrounds are drawn in code.
