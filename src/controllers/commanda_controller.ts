import { genID } from "../crypt";
import db from "../database/db";
import { nanoid } from "nanoid/async";

export async function create(commanda: {
  costumer: string;
  table?: number | null;
  restaurant: string;
}) {
  const public_id = await genID();

  console.log(
    db.insertInto("commanda").values(({ selectFrom }) => ({
      costumer: commanda.costumer,
      table: commanda.table ?? null,
      id: undefined,
      public_id,
      restaurant_id: selectFrom("restaurant")
        .select("id as restaurant_id")
        .where("public_id", "=", commanda.restaurant)
    })).compile().sql
  );

  console.log("Table", commanda.table)

  const result = await db
    .insertInto("commanda")
    .values(({selectFrom}) => ({
      costumer: commanda.costumer,
      table: commanda.table ?? undefined,
      id: undefined,
      public_id,
      restaurant_id: selectFrom("restaurant")
        .select("id as restaurant_id")
        .where("public_id", "=", commanda.restaurant)
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
    .executeTakeFirstOrThrow();

  return result;
}
