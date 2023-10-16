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
