# Web Release Checklist

## Build

1. Run `npm run build`.
2. Confirm `dist/index.html` exists.
3. Confirm `dist/Images/` and `dist/Sound/` exist.

## Smoke Test

1. Run `npm run preview`.
2. Start a fresh save and reach normal combat.
3. Verify music starts after user input.
4. Verify equipment icons render in inventory.
5. Verify the Slimefang demo-complete flow still works from a real playthrough.

## Hosting Notes

- Upload the contents of `dist/` as the web root.
- The build uses a relative Vite base (`./`), so it can be hosted from a subfolder.
- Static hosts are usually case-sensitive. Keep asset folder names exactly as shipped in `dist/`.

## Release Metadata

- Public game title: `Exile's Ascension`
- Repository/package slug: `exiles-ascension`
- Current shipped slice: Area 1 demo ending at Slimefang
