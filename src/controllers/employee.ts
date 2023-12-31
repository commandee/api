import db from "../database/db";
import { encrypt, genID } from "../crypt";
import bcrypt from "bcryptjs";
import APIError from "../api_error";
import * as RestaurantControl from "./restaurant";
import type { Role } from "../database/generated/schema/enums";

export async function getAllFrom(restaurantId: string) {
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

export async function get(id: string) {
  const employee = await db
    .selectFrom("employee")
    .select(["public_id as id", "username", "email"])
    .where("public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Employee not found"));

  return employee;
}

export async function getByUsername(username: string) {
  const employee = await db
    .selectFrom("employee")
    .select(["public_id as id", "username", "email"])
    .where("username", "=", username)
    .executeTakeFirstOrThrow(APIError.noResult("Employee not found"));

  return employee;
}

export async function create(employee: {
  username: string;
  email: string;
  password: string;
}) {
  const [publicId, encryptedPassword] = await Promise.all([
    genID(),
    encrypt(employee.password)
  ]);

  const result = await db
    .insertInto("employee")
    .values({
      ...employee,
      id: undefined,
      public_id: publicId,
      password: encryptedPassword
    })
    .executeTakeFirst();

  if (result?.numInsertedOrUpdatedRows !== 1n) {
    throw new APIError("Employee not created", 500);
  }

  return publicId;
}

export async function update(
  id: string,
  data: { username?: string; email?: string; password?: string }
) {
  const result = await db
    .updateTable("employee")
    .set({
      ...data,
      password: data.password ? await encrypt(data.password) : undefined
    })
    .where("public_id", "=", id)
    .executeTakeFirst();

  if (result?.numUpdatedRows !== 1n) {
    throw new APIError("Employee not found", 404);
  }
}

export async function login({
  email,
  password,
  restaurantId
}: {
  email: string;
  password: string;
  restaurantId?: string;
}): Promise<{
  id: string;
  restaurant?: {
    id: string;
    role: Role;
  };
}> {
  const user = await db
    .selectFrom("employee")
    .select(["password as hashedPassword", "public_id as id"])
    .where("email", "=", email)
    .executeTakeFirstOrThrow(APIError.noResult("Employee not found"));

  const [role, restaurant] = await Promise.all([
    restaurantId
      ? RestaurantControl.isEmployee(user.id, restaurantId)
      : undefined,
    restaurantId ? RestaurantControl.get(restaurantId) : undefined,
    bcrypt.compare(password, user.hashedPassword).then((valid) => {
      if (!valid) throw new APIError("Invalid password", 401);
      return valid;
    })
  ]);

  return {
    id: user.id,
    restaurant: restaurant && role && { id: restaurant.id, role }
  };
}

export async function changeId(currentId: string): Promise<string> {
  const newId = await genID();

  const response = await db
    .updateTable("employee")
    .set({ public_id: newId })
    .where("public_id", "=", currentId)
    .executeTakeFirst();

  if (response?.numUpdatedRows !== 1n) {
    throw new APIError("Employee not updated", 500);
  }

  return newId;
}

export async function del({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const { id } = await login({ email, password });

  const result = await db
    .deleteFrom("employee")
    .where("public_id", "=", id)
    .executeTakeFirst();

  if (result.numDeletedRows !== 1n)
    throw new APIError("Employee not deleted", 500);
}

export async function info({
  userId,
  restaurantId
}: {
  userId: string;
  restaurantId?: string;
}) {
  const promises: [
    Promise<{ id: string; username: string; email: string }>,
    Promise<{ id: string; name: string; address: string }> | undefined,
    Promise<Role> | undefined
  ] = [get(userId), undefined, undefined];

  if (restaurantId) {
    promises[1] = RestaurantControl.get(restaurantId);
    promises[2] = RestaurantControl.isEmployee(userId, restaurantId);
  }

  const [employee, restaurant, role] = await Promise.all(promises);

  return {
    id: employee.id,
    username: employee.username,
    email: employee.email,
    restaurant:
      restaurant && role
        ? {
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            role
          }
        : undefined
  };
}

export async function worksAt(userId: string) {
  const result = await db
    .selectFrom("employment")
    .innerJoin("employee", "employee.id", "employment.employee_id")
    .innerJoin("restaurant", "restaurant.id", "employment.restaurant_id")
    .where("employee.public_id", "=", userId)
    .select([
      "restaurant.public_id as id",
      "restaurant.name",
      "restaurant.address"
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
