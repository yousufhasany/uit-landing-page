import { prisma } from '../src/lib/prisma.js';

const slides = [
  { file: 'temporary-campus-entrance.jpg', caption: 'UIT temporary campus, Duara, Daudpur, Rupganj' },
  { file: 'education-minister-meeting.jpg', caption: 'Meeting with the Honorable Education Minister of Bangladesh' },
  { file: 'malaysia-high-commission-meeting.jpg', caption: 'Courtesy visit to the High Commission of Malaysia in Dhaka' },
  { file: 'malaysia-high-commission-visit.jpg', caption: 'Courtesy visit to the High Commission of Malaysia in Dhaka' },
  { file: 'malaysia-high-commission-group.jpg', caption: 'UIT delegation at the High Commission of Malaysia in Dhaka' },
  { file: 'ugc-inspection-meeting.jpg', caption: 'UGC formal inspection at UIT' },
];

const assets = await prisma.mediaAsset.findMany({
  where: { originalFilename: { in: slides.map((s) => s.file) } },
  select: { id: true, originalFilename: true },
});
const idOf = new Map(assets.map((a) => [a.originalFilename, a.id]));
const missing = slides.filter((s) => !idOf.has(s.file)).map((s) => s.file);
if (missing.length) throw new Error(`Missing media: ${missing.join(', ')}`);

const payload = slides.map((s) => ({ imageId: idOf.get(s.file), caption: s.caption }));
const hero = await prisma.homepageSection.findFirst({ where: { type: 'HERO' } });
if (!hero) throw new Error('No hero section');

const merge = (data: unknown) => ({ ...(data as object), imageId: payload[0].imageId, caption: payload[0].caption, slides: payload });
await prisma.homepageSection.update({
  where: { id: hero.id },
  data: {
    draftData: merge(hero.draftData),
    publishedData: merge(hero.publishedData ?? hero.draftData),
  },
});
console.log(`Hero banner now rotates ${payload.length} photographs.`);
await prisma.$disconnect();
