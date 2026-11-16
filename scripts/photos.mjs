import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import sharp from 'sharp'

const PHOTOS = [
  { name: 'mayon-sunrise', id: 7467112, alt: 'Mayon Volcano rising above a field of red flowers under a blue sky', credit: 'Chriz Luminario', title: 'A Volcano Under Blue Sky' },
  { name: 'mayon-dusk', id: 990871, alt: 'Mayon Volcano at dusk above the bay, with the lights of the Legazpi shoreline in front', credit: 'Archie Binamira', title: 'Mayon Volcano' },
  { name: 'room-single', id: 39338470, alt: 'Bright single room with a made single bed, desk and white curtains', credit: 'Mateusz Pielech', title: 'Minimalist Modern Bedroom with White Decor' },
  { name: 'room-twin', id: 18470959, alt: 'Twin room with two single beds, white linen and a bedside lamp between them', credit: 'Alan Antony', title: 'Two Beds in a Hotel Bedroom' },
  { name: 'room-deluxe', id: 21629415, alt: 'Double bed with brown linen, a carved wooden headboard and warm bedside lamps', credit: 'Chris F', title: 'Double Bed with Brown Sheets' },
  { name: 'room-triple', id: 14465274, alt: 'Wood-panelled room with beds made up in white sheets', credit: 'AHMED AQEELY', title: 'Wooden Hotel Room with Beds Covered in White Sheets' },
  { name: 'room-family', id: 4221409, alt: 'Family room with a wooden bunk bed, a window and a striped rug', credit: 'Curtis Adams', title: "Double Decker Bed in the Kid's Bedroom" },
  { name: 'roof-deck', id: 6430734, alt: 'Terrace with wicker chairs, tropical plants and a view through the glass doors', credit: 'Skylar Kang', title: 'Backyard of modern residential villa with comfy wicker furniture and tropical plants' },
  { name: 'kitchen', id: 5998041, alt: 'Bright open kitchen with white cabinets, a breakfast bar and bar stools', credit: 'Max Vakhtbovych', title: 'Stylish interior of kitchen in house' }
]

const SIZES = { card: 640, full: 1600 }
await mkdir('storage/app/photos/stock', { recursive: true })
await mkdir('public/photos', { recursive: true })

const manifest = {}
for (const p of PHOTOS) {
  const original = `storage/app/photos/stock/${p.name}.jpg`
  if (!existsSync(original)) {
    const res = await fetch(`https://images.pexels.com/photos/${p.id}/pexels-photo-${p.id}.jpeg?auto=compress&cs=tinysrgb&w=2000`)
    if (!res.ok) throw new Error(`${p.name}: ${res.status}`)
    await writeFile(original, Buffer.from(await res.arrayBuffer()))
  }
  const input = await readFile(original)
  const meta = await sharp(input).metadata()
  manifest[p.name] = { alt: p.alt, credit: p.credit, source: `https://www.pexels.com/photo/${p.id}/`, width: meta.width, height: meta.height, isStock: true }
  for (const [label, width] of Object.entries(SIZES)) {
    const out = await sharp(input).resize({ width: Math.min(width, meta.width), withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true })
    await writeFile(`public/photos/${p.name}-${label}.webp`, out.data)
    manifest[p.name][label] = { width: out.info.width, height: out.info.height }
  }
}
await writeFile('src/data/photos.generated.json', JSON.stringify(manifest, null, 2))

const rows = PHOTOS.map(p => `| ${p.name}-card.webp, ${p.name}-full.webp | ${p.credit} | ${p.title} | https://www.pexels.com/photo/${p.id}/ | Pexels License |`)
await writeFile('docs/photo-credits.md', ['# Photo credits', '', 'Stock photos used until the client\'s own photos arrive. Originals are in `storage/app/photos/stock/`. Replace all room and property photos before launch.', '', '| File | Photographer | Title | Source | License |', '|---|---|---|---|---|', ...rows, ''].join('\n'))
console.log(Object.keys(manifest).length, 'photos ready')
