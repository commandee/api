import type { Employee } from "../database/generated/schema/schema";
import db from "../database/db";
import { encrypt } from "../crypt";
import { nanoid } from "nanoid/async";
import bcrypt from "bcryptjs";

export async function create(employee: Omit<Employee, "id">) {
  const [id, encryptedPassword] = await Promise.all([
    nanoid(),
    encrypt(employee.password)
  ]);

  const result = await db
    .insertInto("employee")
    .values({
      ...employee,
      id,
      password: encryptedPassword
    })
    .executeTakeFirst();

  return result;
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
    .select(["password", "id"])
    .where("email", "=", email)
    .executeTakeFirstOrThrow();

  if (!(await bcrypt.compare(password, hashedPassword)))
    throw new Error("Invalid password");

  return { email, password, id };
}

export async function drop({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const { id } = await login({ email, password });

  const result = await db
    .deleteFrom("employee")
    .where("id", "=", id)
    .executeTakeFirst();

  return result?.numDeletedRows === 1n;
}
