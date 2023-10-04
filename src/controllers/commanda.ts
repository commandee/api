import APIError from "../api_error";
import { genID } from "../crypt";
import db from "../database/db";

export async function get(id: string) {
  const commanda = await db
    .selectFrom("commanda")
    .innerJoin("restaurant", "restaurant.id", "commanda.restaurant_id")
    .select([
      "commanda.costumer",
      "commanda.table",
      "commanda.public_id as id"
    ])
    .where("commanda.public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Commanda not found"));

  return commanda;
}

export async function create(commanda: {
  costumer: string;
  table?: number | null;
}, restaurant: string) {
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

  return result.numInsertedOrUpdatedRows === 1n;
}

export async function getAllFrom(restaurant: string) {
  const result = await db
    .selectFrom("commanda")
    .innerJoin("restaurant", "restaurant.id", "commanda.restaurant_id")
    .select([
      "commanda.costumer",
      "commanda.table",
      "commanda.public_id as id",
      "restaurant.public_id as restaurant"
    ])
    .where("restaurant.public_id", "=", restaurant)
    .execute();

  return result;
}
