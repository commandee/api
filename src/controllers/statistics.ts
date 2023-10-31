import APIError from "../api_error";
import db from "../database/db";

export async function mostSold(restaurantId: string) {
  const product = await db
    .selectFrom("order")
    .groupBy("order.item_id")
    .innerJoin("item", "item.id", "order.item_id")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .where("restaurant.public_id", "=", restaurantId)
    .orderBy(({ fn }) => fn.count("order.item_id"), "desc")
    .select([
      "item.name",
      "item.public_id as id",
      "item.price",
      "item.description"
    ])
    .limit(1)
    .executeTakeFirstOrThrow(APIError.noResult("No products found"));

  return {
    ...product,
    description: product.description || undefined
  };
}

export async function leastSold(restaurantId: string) {
  const item = await db
    .selectFrom("order")
    .innerJoin("item", "item.id", "order.item_id")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .groupBy("order.item_id")
    .where("restaurant.public_id", "=", restaurantId)
    .select([
      "item.name",
      "item.description",
      "item.price",
      "item.public_id as id"
    ])
    .orderBy(({ fn }) => fn.countAll(), "asc")
    .limit(1)
    .executeTakeFirstOrThrow(APIError.noResult("No products found."));

  return {
    ...item,
    description: item.description || undefined
  };
}
