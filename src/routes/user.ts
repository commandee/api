import type { FastifyInstance } from "../server";
import * as userControl from "../controllers/employee";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        summary: "Returns the current user",
        tags: ["user"],
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", minLength: 16, maxLength: 16 },
              username: { type: "string", minLength: 3, maxLength: 255 },
              email: { type: "string", format: "email", maxLength: 255 },
              restaurant: {
                type: "object",
                properties: {
                  id: { type: "string", minLength: 16, maxLength: 16 },
                  name: { type: "string", minLength: 3, maxLength: 255 },
                  address: { type: "string", minLength: 3, maxLength: 255 },
                  role: { type: "string", enum: ["admin", "employee"] }
                },
                required: ["id", "name", "address", "role"]
              }
            },
            required: ["id", "username", "email"],
            description: "The user has been logged in successfully"
          }
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticate(request, reply);

      return reply.send(
        await userControl.info({
          userId: request.user.id,
          restaurantId: request.user.restaurant?.id
        })
      );
    }
  );

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
        }
      } as const
    },
    async (request, reply) => {
      const user = request.body;
      const userId = await userControl.create(user);

      return reply.code(201).sendLogin({ userId });
    }
  );

  fastify.patch(
    "/",
    {
      schema: {
        summary: "Update user",
        tags: ["user"],
        body: {
          type: "object",
          properties: {
            username: { type: "string", minLength: 3, maxLength: 255 },
            email: { type: "string", format: "email", maxLength: 255 },
            password: { type: "string", minLength: 8, maxLength: 255 }
          },
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticate(request, reply);

      const user = request.body;
      const userId = request.user.id;
      await userControl.update(userId, user);

      return reply.sendLogin({
        userId,
        restaurantId: request.user.restaurant?.id
      });
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
            password: { type: "string", minLength: 8, maxLength: 255 },
            restaurantId: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the restaurant (optional)"
            }
          },
          required: ["password", "email"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", minLength: 16, maxLength: 16 },
              username: { type: "string", minLength: 3, maxLength: 255 },
              email: { type: "string", format: "email", maxLength: 255 },
              restaurant: {
                type: "object",
                properties: {
                  id: { type: "string", minLength: 16, maxLength: 16 },
                  name: { type: "string", minLength: 3, maxLength: 255 },
                  address: { type: "string", minLength: 3, maxLength: 255 },
                  role: { type: "string", enum: ["admin", "employee"] }
                },
                required: ["id", "name", "address", "role"]
              }
            },
            required: ["id", "username", "email"],
            description: "The user has been logged in successfully"
          },
          401: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 401 },
              error: { type: "string", const: "Unauthorized" },
              message: { type: "string", const: "Invalid password" }
            },
            description:
              "The given password does not match the given user's password"
          },
          404: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 404 },
              error: { type: "string", const: "Not Found" },
              message: { type: "string", const: "User not found" }
            },
            description: "The given email does not match an existing user"
          }
        },
        produces: ["text/plain"]
      } as const
    },
    async (request, reply) => {
      const loginInfo = request.body;
      const user = await userControl.login(loginInfo);

      return reply.sendLogin({
        userId: user.id,
        restaurantId: loginInfo.restaurantId
      });
    }
  );

  fastify.post("/logout", async (_request, reply) => {
    reply.clearCookie("token", {
      path: "/",
      httpOnly: true,
      sameSite: true,
      secure: true
    });

    return reply.send("User logged out successfully");
  });

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
      await userControl.del(request.body);
      return reply.send("User deleted successfully");
    }
  );

  fastify.patch(
    "/change-id",
    {
      schema: {
        response: {
          200: {
            type: "object",
            description: "New login information for the user"
          }
        }
      }
    },
    async (request, reply) => {
      await fastify.authenticate(request, reply);

      const newId = await userControl.changeId(request.user.id);
      return reply.sendLogin({
        userId: newId,
        restaurantId: request.user.restaurant?.id
      });
    }
  );
}
