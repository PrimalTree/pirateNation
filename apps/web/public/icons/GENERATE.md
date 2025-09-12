Generate PNG icons from SVGs (recommended for iOS and legacy fallbacks)

We ship vector SVG icons for maskable/any/monochrome. To add PNG fallbacks, export PNGs at exact sizes from the provided SVGs.

Targets
- /icons/icon-192.png
- /icons/icon-512.png
- /icons/maskable-icon-192.png
- /icons/maskable-icon-512.png
- /icons/monochrome-icon.png (192 and 512 sizes)
- /icons/apple-touch-icon.png (180x180)

Using Inkscape (cross‑platform)
1) 192px any icon
   inkscape icon-192.svg -o icon-192.png -w 192 -h 192

2) 512px any icon
   inkscape icon-512.svg -o icon-512.png -w 512 -h 512

3) 192px maskable icon
   inkscape maskable-icon-192.svg -o maskable-icon-192.png -w 192 -h 192

4) 512px maskable icon
   inkscape maskable-icon-512.svg -o maskable-icon-512.png -w 512 -h 512

5) Monochrome icons (export twice at 192 and 512)
   inkscape monochrome-icon.svg -o monochrome-icon.png -w 192 -h 192
   inkscape monochrome-icon.svg -o monochrome-icon-512.png -w 512 -h 512
   (Optionally duplicate monochrome-icon-512.png to monochrome-icon.png for 512 size)

6) Apple touch icon (180x180)
   inkscape icon-192.svg -o apple-touch-icon.png -w 180 -h 180

Using ImageMagick (if SVG rasterizer available)
   magick convert -background none -resize 192x192 icon-192.svg icon-192.png
   magick convert -background none -resize 512x512 icon-512.svg icon-512.png
   magick convert -background none -resize 192x192 maskable-icon-192.svg maskable-icon-192.png
   magick convert -background none -resize 512x512 maskable-icon-512.svg maskable-icon-512.png
   magick convert -background none -resize 192x192 monochrome-icon.svg monochrome-icon.png
   magick convert -background none -resize 180x180 icon-192.svg apple-touch-icon.png

After exporting
- Verify files exist with correct sizes.
- No code changes needed; manifest and head links already reference these PNGs.

