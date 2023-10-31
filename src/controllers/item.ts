import APIError from "../api_error";
import db from "../database/db";

export async function get(id: string) {
  const item = await db
    .selectFrom("item")
    .where("item.public_id", "=", id)
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .select([
      "item.public_id as id",
      "item.name",
      "item.price",
      "item.description",
      "restaurant.public_id as restaurantId"
    ])
    .executeTakeFirstOrThrow(APIError.noResult("Item not found"));

  return {
    ...item,
    description: item.description ?? undefined
  };
}

export async function getMenu(restaurantId: string) {
  const menu = await db
    .selectFrom("item")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .select([
      "item.name",
      "item.price",
      "item.public_id as id",
      "item.description"
    ])
    .where("restaurant.public_id", "=", restaurantId)
    .execute();

  return menu.map((item) => ({
    ...item,
    description: item.description ?? undefined
  }));
}

export async function countMenu(restaurantId: string) {
  const { count } = await db
    .selectFrom("item")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .where("restaurant.public_id", "=", restaurantId)
    .groupBy("restaurant.public_id")
    .select((eb) => eb.fn.countAll().as("count"))
    .executeTakeFirstOrThrow();

  return count;
}
