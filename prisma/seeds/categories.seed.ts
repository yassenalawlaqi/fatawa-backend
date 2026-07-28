import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  console.log('Seeding Categories...');

  const categoryTree = [
    {
      name: 'العقيدة',
      slug: 'aqeedah',
      children: [
        { name: 'التوحيد', slug: 'tawheed' },
        { name: 'الشرك', slug: 'shirk' },
        { name: 'البدع', slug: 'bidaa' },
      ]
    },
    {
      name: 'الطهارة',
      slug: 'taharah',
      children: [
        { name: 'الوضوء', slug: 'wudu' },
        { name: 'الغسل', slug: 'ghusl' },
        { name: 'التيمم', slug: 'tayammum' },
      ]
    },
    {
      name: 'الصلاة',
      slug: 'salat',
      children: [
        { name: 'الجمعة', slug: 'jumah' },
        { name: 'الجماعة', slug: 'jamaah' },
        { name: 'السنن', slug: 'sunnah' },
      ]
    },
    {
      name: 'الصيام',
      slug: 'siyam',
      children: [
        { name: 'رمضان', slug: 'ramadan' },
        { name: 'القضاء', slug: 'qadaa' },
        { name: 'الكفارة', slug: 'kafarah' },
      ]
    },
    { name: 'الزكاة', slug: 'zakat', children: [] },
    { name: 'الحج', slug: 'hajj', children: [] },
    { name: 'البيع', slug: 'bay', children: [] },
    { name: 'الربا', slug: 'riba', children: [] },
    { name: 'النكاح', slug: 'nikah', children: [] },
    { name: 'الطلاق', slug: 'talaq', children: [] },
    { name: 'الجنائز', slug: 'janaiz', children: [] },
    { name: 'الأيمان', slug: 'ayman', children: [] },
    { name: 'المرأة', slug: 'maraa', children: [] },
    { name: 'الأطعمة', slug: 'atamah', children: [] },
    { name: 'اللباس', slug: 'libas', children: [] },
  ];

  for (const parent of categoryTree) {
    const parentCat = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name },
      create: { name: parent.name, slug: parent.slug }
    });

    if (parent.children && parent.children.length > 0) {
      for (const child of parent.children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: { name: child.name, parentId: parentCat.id },
          create: { name: child.name, slug: child.slug, parentId: parentCat.id }
        });
      }
    }
  }

  console.log('Categories seeded.');
}
