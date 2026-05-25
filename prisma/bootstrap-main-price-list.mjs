import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import pg from "pg";
import { MAIN_PRICE_LIST, MAIN_PRICE_LIST_ITEMS } from "./main-price-list-data.mjs";

const { Pool } = pg;

const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;

if (!directDatabaseUrl) {
  throw new Error("DIRECT_DATABASE_URL is required to bootstrap the main price list.");
}

const pool = new Pool({
  connectionString: directDatabaseUrl,
  max: 1
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function bootstrapMainPriceList() {
  await prisma.$transaction(async (tx) => {
    await tx.priceList.upsert({
      where: { id: MAIN_PRICE_LIST.id },
      update: {
        name: MAIN_PRICE_LIST.name,
        slug: MAIN_PRICE_LIST.slug,
        isActive: true
      },
      create: {
        id: MAIN_PRICE_LIST.id,
        name: MAIN_PRICE_LIST.name,
        slug: MAIN_PRICE_LIST.slug,
        isActive: true
      }
    });

    for (const item of MAIN_PRICE_LIST_ITEMS) {
      await tx.priceListItem.upsert({
        where: {
          priceListId_itemType_sizeCm: {
            priceListId: MAIN_PRICE_LIST.id,
            itemType: item.itemType,
            sizeCm: item.sizeCm
          }
        },
        update: {
          priceKopecks: item.priceKopecks,
          note: item.note,
          sortOrder: item.sortOrder,
          isActive: true
        },
        create: {
          priceListId: MAIN_PRICE_LIST.id,
          itemType: item.itemType,
          sizeCm: item.sizeCm,
          priceKopecks: item.priceKopecks,
          note: item.note,
          sortOrder: item.sortOrder,
          isActive: true
        }
      });
    }

    await tx.product.updateMany({
      where: {
        priceListId: null
      },
      data: {
        priceListId: MAIN_PRICE_LIST.id
      }
    });
  });
}

bootstrapMainPriceList()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "main_price_list_bootstrap_failed");
    await prisma.$disconnect().catch(() => undefined);
    await pool.end().catch(() => undefined);
    process.exit(1);
  });
