import { JSONSchema7 } from "json-schema";
import { FastifyInstance } from "../server";
import db from "../database/db";
import { encrypt } from "../crypt";
import { nanoid } from "nanoid/async";
import bcrypt from "bcryptjs";
import * as UserControl from "../controllers/employee_controller";

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      schema: {
        summary: "Create user",
        tags: ["user"],
        body: {
          type: "object",
          properties: {
            username: { type: "string", minLength: 3, maxLength: 255 },
            email: { type: "string", format: "email", maxLength: 255 },
            password: { type: "string", minLength: 8, maxLength: 255 }
          },
          required: ["username", "email", "password"]
        },
        response: {
          201: { type: "boolean" },
          500: { type: "null" }
        }
      } as const
    },
    async (request, reply) => {
      const { username, email, password } = request.body;

      const [id, encryptedPassword] = await Promise.all([
        nanoid(),
        encrypt(password)
      ]);

      const user = await db
        .insertInto("employee")
        .values({
          id,
          username,
          email,
          password: encryptedPassword
        })
        .execute();

      if (!user[0]) {
        return reply.code(500).send();
      }

      return reply.code(201).send(true);
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get user",
        tags: ["user"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 21,
              maxLength: 21,
              description: "The NanoID of the user to retrieve"
            }
          },
          required: ["id"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", minLength: 21, maxLength: 21 },
              username: { type: "string", minLength: 3, maxLength: 255 },
              email: { type: "string", format: "email", maxLength: 255 }
            },
            required: ["id", "username", "email"],
            additionalProperties: false
          },
          404: {
            type: "string",
            const: "Not found",
            description: "A user with the given ID does not exist",
            contentMediaType: "text/plain"
          }
        },
        produces: ["application/json", "text/plain"]
      } as const
    },
    async (request, reply) => {
      const { id } = request.params;

      const user = await db
        .selectFrom("employee")
        .where("id", "=", id)
        .select(["id", "username", "email"])
        .executeTakeFirst();

      if (!user) {
        return reply.code(404).send("Not found");
      }

      return reply.send(user);
    }
  );

  fastify.post(
    "/login",
    {
      schema: {
        summary: "Login",
        description: "Login endpoint for users",
        tags: ["user"],
        body: {
          type: "object",
          description: "Login credentials",
          properties: {
            email: { type: "string", format: "email", maxLength: 255 },
            password: { type: "string", minLength: 8, maxLength: 255 }
          },
          required: ["password", "email"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "string",
            const: "Logged in",
            description: "The user has been logged in successfully"
          },
          401: {
            type: "string",
            const: "Invalid password",
            description:
              "The given password does not match the given user's password"
          },
          404: {
            type: "string",
            const: "User not found",
            description: "The given email does not match an existing user"
          } satisfies JSONSchema7
        },
        produces: ["text/plain"]
      } as const
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await db
        .selectFrom("employee")
        .where("email", "=", email)
        .select("password")
        .executeTakeFirst();

      if (!user) return reply.code(404).send("User not found");

      if (!(await bcrypt.compare(password, user.password)))
        return reply.code(401).send("Invalid password");

      return reply.code(200).send("Logged in");
    }
  );

  fastify.delete(
    "/",
    {
      schema: {
        summary: "Delete user",
        tags: ["user"],
        description: "Delete user endpoint",
        body: {
          type: "object",
          description: "Delete credentials",
          properties: {
            email: { type: "string", format: "email", maxLength: 255 },
            password: { type: "string", minLength: 8, maxLength: 255 }
          },
          required: ["password", "email"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "string",
            const: "User deleted successfully",
            description: "The user has been deleted successfully"
          }
        },
        produces: ["text/plain"]
      } as const
    },
    async (request, reply) => {
      const res = await UserControl.drop(request.body);

      if (!res) return reply.code(500).send("User deleted successfully");
      return reply.code(200).send("User deleted successfully");
    }
  );
}
