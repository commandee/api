import APIError from "../api_error";
import { genID } from "../crypt";
import db from "../database/db";

export async function getAll(restaurantId: string) {
  const result = await db
    .selectFrom("commanda")
    .innerJoin("restaurant", "restaurant.id", "commanda.restaurant_id")
    .where("restaurant.public_id", "=", restaurantId)
    .select([
      "commanda.costumer",
      "commanda.table",
      "commanda.public_id as id",
      "restaurant.public_id as restaurantId"
    ])
    .execute();

  return result;
}

export async function getOrders(id: string) {
  const result = await db
    .selectFrom("order")
    .innerJoin("commanda", "commanda.id", "order.commanda_id")
    .innerJoin("item", "item.id", "order.item_id")
    .select([
      "order.priority",
      "order.status",
      "order.public_id as id",
      "commanda.public_id as commandaId",
      "order.quantity",
      "order.notes",
      "item.public_id as itemId",
    ])
    .where("commanda.public_id", "=", id)
    .execute();

  return result;
}

export async function get(id: string) {
  const commanda = await db
    .selectFrom("commanda")
    .innerJoin("restaurant", "restaurant.id", "commanda.restaurant_id")
    .select([
      "commanda.costumer",
      "commanda.table",
      "commanda.public_id as id",
      "restaurant.public_id as restaurantId",
    ])
    .where("commanda.public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Commanda not found"));

  return commanda;
}

export async function create(
  commanda: {
    costumer: string;
    table?: number | null;
  },
  restaurant: string
) {
  const public_id = await genID();

  const result = await db
    .insertInto("commanda")
    .values(({ selectFrom }) => ({
      costumer: commanda.costumer,
      table: commanda.table || undefined,
      id: undefined,
      public_id,
      restaurant_id: selectFrom("restaurant")
        .select("id as restaurant_id")
        .where("public_id", "=", restaurant)
    }))
    .executeTakeFirstOrThrow();

  if (result.numInsertedOrUpdatedRows !== 1n)
    throw new APIError("Commanda not created", 500);
}

export async function del(id: string) {
  const result = await db
    .deleteFrom("commanda")
    .where("public_id", "=", id)
    .executeTakeFirst();

  if (result?.numDeletedRows !== 1n)
    throw new APIError("Commanda not deleted", 500);
}

export async function getRestaurantOf(id: string): Promise<string> {
  const result = await db
    .selectFrom("commanda")
    .innerJoin("order", "order.commanda_id", "commanda.id")
    .innerJoin("item", "item.id", "order.item_id")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .select("restaurant.public_id as id")
    .where("commanda.public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Commanda not found"));

  return result.id;
}
