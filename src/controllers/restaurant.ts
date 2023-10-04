import APIError from "../api_error";
import { genID } from "../crypt";
import db from "../database/db";
import * as EmployeeControl from "./employee"; 

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

export async function login({ userId, restaurantId }: {
  userId: string, restaurantId: string }) {
    await get(restaurantId);
    await EmployeeControl.get(userId);

    const result = await db
      .selectFrom("employment")
      .innerJoin("employee", "employee.id", "employment.employee_id")
      .innerJoin("restaurant", "restaurant.id", "employment.restaurant_id")
      .where("employee.public_id", "=", userId)
      .where("restaurant.public_id", "=", restaurantId)
      .select("restaurant.public_id as id")
      .executeTakeFirstOrThrow(APIError.noResult("User does not work at this restaurant"));

    return {
      restaurantId: result.id,
      userId: userId
    }
  }

