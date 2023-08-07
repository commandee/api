import APIError from "../api_error";
import { genID } from "../crypt";
import db from "../database/db";

export async function get(id: string) {
  const restaurant = await db
    .selectFrom("restaurant")
    .select(["public_id as id", "name", "address"])
    .where("public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Restaurant not found"));

  return restaurant;
}

export async function create(restaurant: { name: string; address: string }) {
  const public_id = await genID();

  const result = await db
    .insertInto("restaurant")
    .values({
      ...restaurant,
      id: undefined,
      public_id
    })
    .executeTakeFirst();

  if (result?.numInsertedOrUpdatedRows !== 1n) {
    throw new APIError("Restaurant not created", 500);
  }

  return result;
}
