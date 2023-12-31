import { sql } from "kysely";
import APIError from "../api_error";
import { genID } from "../crypt";
import db from "../database/db";
import type { Role } from "../database/generated/schema/enums";
import * as employeeControl from "./employee";

export async function get(id: string) {
  const restaurant = await db
    .selectFrom("restaurant")
    .select(["public_id as id", "name", "address"])
    .where("public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Restaurant not found"));

  return restaurant;
}

export async function create(restaurant: {
  name: string;
  address: string;
}): Promise<string> {
  const public_id = await genID();

  const result = await db
    .insertInto("restaurant")
    .values({
      name: restaurant.name,
      address: restaurant.address,
      public_id
    })
    .executeTakeFirst();

  if (result?.numInsertedOrUpdatedRows !== 1n) {
    throw new APIError("Restaurant not created", 500);
  }

  return public_id;
}

export async function update(restaurantId: string, data: {
  name?: string;
  address?: string;
}) {
  const result = await db
    .updateTable("restaurant")
    .set(data)
    .where("public_id", "=", restaurantId)
    .executeTakeFirst();

  if (result?.numUpdatedRows !== 1n) {
    throw new APIError("Restaurant not found", 404);
  }
}

export async function login({
  userId,
  restaurantId
}: {
  userId: string;
  restaurantId: string;
}): Promise<{
  id: string;
  restaurant: {
    id: string;
    role: Role;
  };
}> {
  const [restaurant, employee, role] = await Promise.all([
    get(restaurantId),
    employeeControl.get(userId),
    isEmployee(userId, restaurantId)
  ]);

  return {
    id: employee.id,
    restaurant: {
      id: restaurant.id,
      role
    }
  };
}

export async function isEmployee(
  userId: string,
  restaurantId: string
): Promise<Role> {
  const { role } = await db
    .selectFrom("employment")
    .innerJoin("restaurant", "restaurant.id", "employment.restaurant_id")
    .innerJoin("employee", "employee.id", "employment.employee_id")
    .where("employee.public_id", "=", userId)
    .where("restaurant.public_id", "=", restaurantId)
    .select("employment.role")
    .executeTakeFirstOrThrow(
      () => new APIError("Employee is not part of this restaurant", 403)
    );

  return role;
}

export async function addEmployment(
  employeeId: string,
  restaurantId: string,
  role?: Role
): Promise<void> {
  await Promise.all([employeeControl.get(employeeId), get(restaurantId)]);

  const result = await db
    .insertInto("employment")
    .values(({ selectFrom }) => ({
      employee_id: selectFrom("employee")
        .select("id")
        .where("public_id", "=", employeeId),
      restaurant_id: selectFrom("restaurant")
        .select("id")
        .where("public_id", "=", restaurantId),
      role
    }))
    .executeTakeFirst();

  if (result?.numInsertedOrUpdatedRows !== 1n) {
    throw new APIError("Employment not created", 500);
  }
}

export async function dismiss(employeeId: string, restaurantId: string) {
  await isEmployee(employeeId, restaurantId);

  const result = await db
    .deleteFrom("employment")
    .using("employment")
    .innerJoin("restaurant", "restaurant.id", "employment.restaurant_id")
    .innerJoin("employee", "employee.id", "employment.employee_id")
    .where("employee.public_id", "=", employeeId)
    .where("restaurant.public_id", "=", restaurantId)
    .executeTakeFirst();

  if (result?.numDeletedRows !== 1n) {
    throw new APIError("Employment not deleted", 404);
  }
}

export async function setRole(
  employeeId: string,
  restaurantId: string,
  role: Role
) {
  await isEmployee(employeeId, restaurantId);
  
  const result = await db
    .updateTable("employment")
    .set({ role })
    .innerJoin("restaurant", "restaurant.id", "employment.restaurant_id")
    .innerJoin("employee", "employee.id", "employment.employee_id")
    .where("employee.public_id", "=", employeeId)
    .where("restaurant.public_id", "=", restaurantId)
    .executeTakeFirst();

  if (result?.numUpdatedRows !== 1n) {
    throw new APIError("Role not changed", 500);
  }
}

export async function areFromSameRestaurant(
  commandaId: string,
  itemId: string
): Promise<void> {
  const result = await sql<{
    commandaRestaurant?: string | null;
    itemRestaurant?: string | null;
  }>`
    SELECT
      (SELECT \`restaurant_id\` FROM \`commanda\` WHERE \`public_id\` = ${commandaId}) as commanda,
      (SELECT \`restaurant_id\` FROM \`item\` WHERE \`public_id\` = ${itemId}) as itemRestaurant
  `
    .execute(db)
    .then((result) => result.rows[0]);

  if (!result.commandaRestaurant)
    throw new APIError("Commanda was not found", 404);

  if (!result.itemRestaurant) throw new APIError("Item does not exist", 404);

  if (result.commandaRestaurant != result.itemRestaurant)
    throw new APIError(
      "Item does not belong to the commanda's restaurant",
      403
    );
}

/*
SELECT `commanda`.`restaurant_id`, `item`.`restaurant_id`
FROM `commanda`, `item`
WHERE `commanda`.`public_id` = 'iiiiiiiiiiiiiiii'
AND `item`.`public_id` = 'llllllllllllllll'
*/

/*
SELECT
  (SELECT `restaurant_id` FROM `commanda` WHERE `public_id` = 'iiiiiiiiiiiiiiii') as commanda,
  (SELECT `restaurant_id` FROM `item` WHERE `public_id` = 'llllllllllllllll') as itemRestaurant
*/

/* 
SELECT `commanda`.`restaurant_id` AS commandaRestaurant, `item`.`restaurant_id` AS itemRestaurant
FROM (SELECT `restaurant_id` FROM `commanda` WHERE `public_id` = 'iiiiiiiiiiiiiiii') as commanda,
(SELECT `restaurant_id` FROM `item` WHERE `public_id` = 'llllllllllllllll') as item
*/
