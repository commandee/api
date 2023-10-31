import type { FastifyInstance } from "../server";
import * as userControl from "../controllers/employee";
import * as restaurantControl from "../controllers/restaurant";
import APIError from "../api_error";

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
      await userControl.create(user);

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

      const token = await reply.jwtSign({
        id: user.id,
        restaurant: user.restaurant
          ? {
              id: user.restaurant.id,
              role: user.restaurant.role
            }
          : undefined
      });

      reply.setCookie("token", token, {
        path: "/",
        httpOnly: true,
        sameSite: true,
        secure: true
      });

      return reply.send(user);
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

  fastify.get(
    "/whoami",
    {
      schema: {
        summary: "Returns username",
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
      await userControl.drop(request.body);
      return reply.send("User deleted successfully");
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get user by public ID",
        tags: ["user"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", minLength: 3, maxLength: 255 }
          },
          required: ["id"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", minLength: 16, maxLength: 16 },
              username: { type: "string", minLength: 3, maxLength: 255 },
              email: { type: "string", format: "email", maxLength: 255 },
              role: { type: "string", enum: ["admin", "employee"] }
            },
            required: ["id", "username", "email", "role"],
            additionalProperties: false
          }
        },
        produces: ["application/json", "text/plain"]
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { id } = request.params;

      if (id !== request.user.id && request.user.restaurant?.role !== "admin")
        throw new APIError(
          "You cannot request users other than yourself or your employees",
          403
        );

      const [user, role] = await Promise.all([
        userControl.get(id),
        restaurantControl.isEmployee({
          userId: id,
          restaurantId: request.user.restaurant?.id!
        })
      ]);

      return reply.send({
        ...user,
        role
      });
    }
  );

  fastify.get(
    "/restaurants",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", minLength: 16, maxLength: 16 },
                name: { type: "string", minLength: 3, maxLength: 255 },
                address: { type: "string", minLength: 3, maxLength: 255 }
              },
              required: ["id", "name", "address"]
            }
          }
        }
      }
    },
    async (request, reply) => {
      await fastify.authenticate(request, reply);

      const restaurantId = request.user.id;
      const worksAt = await userControl.worksAt(restaurantId);

      return reply.send(worksAt);
    }
  );
}
