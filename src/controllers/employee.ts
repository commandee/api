import db from "../database/db";
import { encrypt, genID } from "../crypt";
import bcrypt from "bcryptjs";
import APIError from "../api_error";

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
  const [public_id, encryptedPassword] = await Promise.all([
    genID(),
    encrypt(employee.password)
  ]);

  const result = await db
    .insertInto("employee")
    .values({
      ...employee,
      id: undefined,
      public_id,
      password: encryptedPassword
    })
    .executeTakeFirst();

  if (result?.numInsertedOrUpdatedRows !== 1n) {
    throw new APIError("Employee not created", 500);
  }
}

export async function login({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const { password: hashedPassword, id } = await db
    .selectFrom("employee")
    .select(["password", "public_id as id"])
    .where("email", "=", email)
    .executeTakeFirstOrThrow(APIError.noResult("Employee not found"));

  if (!(await bcrypt.compare(password, hashedPassword))) {
    throw new APIError("Invalid password", 401);
  }

  return id;
}

export async function drop({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const id = await login({ email, password });

  const result = await db
    .deleteFrom("employee")
    .where("public_id", "=", id)
    .executeTakeFirst();

  if (result.numDeletedRows !== 1n)
    throw new APIError("Employee not deleted", 500);
}
