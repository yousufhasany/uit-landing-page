import { prisma, type Db, type Prisma } from '../lib/prisma.js';

export const mediaInclude = {
  tags: { include: { tag: true } },
  folder: { select: { id: true, name: true } },
  uploadedBy: { select: { id: true, name: true } },
} satisfies Prisma.MediaAssetInclude;

export const mediaRepository = {
  list: (args: { where: Prisma.MediaAssetWhereInput; orderBy: Prisma.MediaAssetOrderByWithRelationInput; skip: number; take: number }) =>
    Promise.all([prisma.mediaAsset.findMany({ ...args, include: mediaInclude }), prisma.mediaAsset.count({ where: args.where })]),
  findById: (id: string, db: Db = prisma) => db.mediaAsset.findUnique({ where: { id }, include: mediaInclude }),
  findManyByIds: (ids: string[], db: Db = prisma) => db.mediaAsset.findMany({ where: { id: { in: ids } } }),
  create: (data: Prisma.MediaAssetUncheckedCreateInput, db: Db = prisma) => db.mediaAsset.create({ data, include: mediaInclude }),
  update: (id: string, data: Prisma.MediaAssetUncheckedUpdateInput, db: Db = prisma) =>
    db.mediaAsset.update({ where: { id }, data, include: mediaInclude }),
  delete: (id: string, db: Db = prisma) => db.mediaAsset.delete({ where: { id } }),
  categories: () =>
    prisma.mediaAsset.groupBy({ by: ['category'], _count: { _all: true }, where: { category: { not: null } }, orderBy: { category: 'asc' } }),
  usage: (id: string) =>
    Promise.all([
      prisma.newsArticle.count({ where: { featuredImageId: id } }),
      prisma.event.count({ where: { featuredImageId: id } }),
      prisma.page.count({ where: { featuredImageId: id } }),
      prisma.center.count({ where: { imageId: id } }),
      prisma.campusItem.count({ where: { imageId: id } }),
      prisma.galleryItem.count({ where: { mediaId: id } }),
      prisma.academicProgram.count({ where: { featuredImageId: id } }),
      prisma.faculty.count({ where: { imageId: id } }),
    ]).then(([news, events, pages, centers, campus, gallery, programs, faculties]) => ({
      news, events, pages, centers, campus, gallery, programs, faculties,
    })),
};
