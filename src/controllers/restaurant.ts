import APIError from "../api_error";
import { genID } from "../crypt";
import db from "../database/db";
import type { Role } from "../database/generated/schema/enums";
import * as EmployeeControl from "./employee";

export async function get(id: string) {
  const restaurant = await db
    .selectFrom("restaurant")
    .select(["public_id as id", "name", "address"])
    .where("public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Restaurant not found"));

  return restaurant;
}

export async function getMenu(id: string) {
  const menu = await db
    .selectFrom("item")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .select([
      "item.name",
      "item.price",
      "item.public_id as id",
      "item.description"
    ])
    .where("restaurant.public_id", "=", id)
    .execute();

  return menu.map((item) => ({
    ...item,
    description: item.description ?? undefined
  }));
}

export async function countMenu(id: string) {
  const { count } = await db
    .selectFrom("item")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .where("restaurant.public_id", "=", id)
    .groupBy("restaurant.public_id")
    .select((eb) => eb.fn.countAll().as("count"))    
    .executeTakeFirstOrThrow();

  return count;
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

export async function login({
  userId,
  restaurantId
}: {
  userId: string;
  restaurantId: string;
}) {
  const [restaurant, employee, role] = await Promise.all([
    get(restaurantId),
    EmployeeControl.get(userId),
    isEmployee({ userId, restaurantId })
  ]);

  if (!role) {
    throw new APIError("Employee is not part of this restaurant", 403);
  }

  return {
    id: employee.id,
    username: employee.username,
    email: employee.email,
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      role
    }
  };
}

export async function isEmployee({
  userId,
  restaurantId
}: {
  userId: string;
  restaurantId: string;
}): Promise<Role> {
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

export async function getEmployees(restaurantId: string) {
  const result = await db
    .selectFrom("employment")
    .innerJoin("employee", "employee.id", "employment.employee_id")
    .innerJoin("restaurant", "restaurant.id", "employment.restaurant_id")
    .where("restaurant.public_id", "=", restaurantId)
    .select([
      "employee.public_id as id",
      "employee.username",
      "employee.email",
      "employment.role"
    ])
    .execute();

  return result;
}

export async function countEmployees(restaurantId: string) {
  const { count } = await db
    .selectFrom("employment")
    .innerJoin("restaurant", "restaurant.id", "employment.restaurant_id")
    .where("restaurant.public_id", "=", restaurantId)
    .groupBy("restaurant.public_id")
    .select((eb) => eb.fn.countAll().as("count"))    
    .executeTakeFirstOrThrow();

  return count;
}
