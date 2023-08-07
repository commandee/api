import APIError from "../api_error";
import db from "../database/db";

export async function mostSelled(restaurant: string) {
  const product = await db
    .selectFrom("order")
    .groupBy("order.item_id")
    .where(({ selectFrom, eb }) =>
      eb(
        selectFrom("restaurant")
          .where("restaurant.public_id", "=", restaurant)
          .select("restaurant.id"),
        "=",
        "order.restaurant_id"
      )
    )
    .innerJoin("item", "item.id", "order.item_id")
    .orderBy(({ fn }) => fn.count("order.item_id"))
    .select(["item.name", "item.public_id as id", "item.price"])
    .limit(1)
    .executeTakeFirstOrThrow(APIError.noResult("No products found"));

  return product;
}
