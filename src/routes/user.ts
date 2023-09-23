import type { FastifyInstance } from "../server";
import * as UserControl from "../controllers/employee";

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
          required: ["username", "email", "password"],
          additionalProperties: false
        },
        response: {
          201: { type: "string", const: "User created successfully" },
          500: { type: "null" }
        }
      } as const
    },
    async (request, reply) => {
      const user = request.body;
      await UserControl.create(user);

      return reply.code(201).send("User created successfully");
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
            description: "The user has been logged in successfully"
          },
          401: {
            type: "string",
            description:
              "The given password does not match the given user's password"
          },
          404: {
            type: "string",
            description: "The given email does not match an existing user"
          }
        },
        produces: ["text/plain"]
      } as const
    },
    async (request, reply) => {
      const loginInfo = request.body;
      const id = await UserControl.validateUser(loginInfo);

      const token = await reply.jwtSign({ id });

      reply.setCookie("token", token, {
        path: "/",
        httpOnly: true,
        sameSite: true,
        secure: true
      });

      return reply.send("Logged in successfully");
    }
  );

  fastify.get(
    "/whoami",
    {
      schema: {
        summary: "Returns username",
        tags: ["user"],
        response: {}
      } as const,
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      return reply.send((await request.user()).username);
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
      await UserControl.drop(request.body);
      return reply.send("User deleted successfully");
    }
  );

  fastify.get(
    "/:username",
    {
      schema: {
        summary: "Get user",
        tags: ["user"],
        params: {
          type: "object",
          properties: {
            username: { type: "string", minLength: 3, maxLength: 255 }
          },
          required: ["username"],
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
            const: "User not found",
            description: "A user with the given ID does not exist",
            contentMediaType: "text/plain"
          }
        },
        produces: ["application/json", "text/plain"]
      } as const
    },
    async (request, reply) => {
      const { username } = request.params;
      const user = await UserControl.getByUsername(username);

      return reply.send(user);
    }
  );
}
