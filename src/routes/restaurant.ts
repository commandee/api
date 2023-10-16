import type { FastifyInstance } from "../server";
import * as restaurantControl from "../controllers/restaurant";
import APIError from "../api_error";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get restaurant",
        description: "Get restaurant by public ID",
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the restaurant"
            }
          },
          required: ["id"],
          additionalProperties: false
        },
        tags: ["restaurant"]
      } as const
    },
    async (request, reply) => {
      const restaurant = await restaurantControl.get(request.params.id);

      return reply.send(restaurant);
    }
  );

  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the restaurant"
            }
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
            required: ["id", "username", "email", "restaurant"]
          }
        }
      } as const
    },
    async (request, reply) => {
      await request.jwtVerify();

      const { id: userId } = request.user;
      const { id: restaurantId } = request.body;

      const login = await restaurantControl.login({ userId, restaurantId });
      const token = await reply.jwtSign({
        id: login.id,
        restaurant: {
          id: login.restaurant.id,
          role: login.restaurant.role
        }
      });

      reply.setCookie("token", token, {
        path: "/",
        httpOnly: true,
        sameSite: true,
        secure: true
      });

      reply.send(login);
    }
  );

  fastify.get(
    "/menu",
    {
      schema: {
        summary: "Get menu from current restaurant",
        tags: ["restaurant", "item"],
        response: {
          200: {
            type: "array",
            description: "List of items in the menu",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                id: { type: "string", minLength: 16, maxLength: 16 },
                name: { type: "string", minLength: 3, maxLength: 255 },
                price: { type: "number", minimum: 0 }
              },
              required: ["id", "name", "price"]
            }
          }
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);
      const menu = await restaurantControl.getMenu(request.user.restaurant!.id);

      return reply.send(menu);
    }
  );

  fastify.get("/menu/count", {
    schema: {
      response: {
        200: {
          type: "number",
          description: "Number of items in the menu"
        }
      }
    }
  }, async (request, reply) => {
    await fastify.authenticateWithRestaurant(request, reply);
    const count = await restaurantControl.countMenu(request.user.restaurant!.id);

    return reply.send(count);
  });
  
  fastify.get(
    "/employees",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", minLength: 16, maxLength: 16 },
                username: { type: "string", minLength: 3, maxLength: 255 },
                email: { type: "string", format: "email", maxLength: 255 },
                role: { type: "string", enum: ["admin", "employee"] }
              },
              required: ["id", "username", "email", "role"]
            }
          }
        }
      }
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { role, id: restaurantId } = request.user.restaurant!;

      if (role !== "admin")
        throw new APIError("Only admins can see employees", 403);

      const employees = await restaurantControl.getEmployees(restaurantId);

      return reply.send(employees);
    }
  );

  fastify.get("/employee/count", {
    schema: {
      response: {
        200: {
          type: "number",
          description: "Number of employees"
        }
      }
    }
  }, async (request, reply) => {
    await fastify.authenticateWithRestaurant(request, reply);

    const { role, id: restaurantId } = request.user.restaurant!;

    if (role !== "admin")
      throw new APIError("Only admins can see employees", 403);

    const count = await restaurantControl.countEmployees(restaurantId);

    return reply.send(count);
  });
}
