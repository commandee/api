import type { FastifyInstance } from "../server";
import * as restaurantControl from "../controllers/restaurant";
import * as employeeControl from "../controllers/employee";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
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
      const worksAt = await employeeControl.worksAt(restaurantId);

      return reply.send(worksAt);
    }
  );

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

  fastify.get("/me", {}, async (request, reply) => {
    await fastify.authenticateWithRestaurant(request, reply);

    const restaurant = await restaurantControl.get(request.user.restaurant!.id);

    return reply.send(restaurant);
  });

  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 3, maxLength: 255 },
            address: { type: "string", minLength: 3, maxLength: 255 }
          },
          required: ["name", "address"],
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticate(request, reply);

      const restaurantId = await restaurantControl.create(request.body);
      await restaurantControl.addEmployment(
        request.user.id,
        restaurantId,
        "admin"
      );

      return reply.sendLogin({ userId: request.user.id, restaurantId });
    }
  );

  fastify.patch(
    "/",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 3, maxLength: 255 },
            address: { type: "string", minLength: 3, maxLength: 255 }
          },
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { id: restaurantId } = request.user.restaurant!;

      await restaurantControl.update(restaurantId, request.body);

      return reply.send("Restaurant updated successfully");
    }
  );

  fastify.delete(
    "/leave",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the user"
            }
          },
          required: ["userId"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { userId } = request.body;
      const { id: restaurantId } = request.user.restaurant!;

      await restaurantControl.dismiss(userId, restaurantId);

      return reply.send("Left restaurant successfully.");
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

      await restaurantControl.login({ userId, restaurantId });

      return reply.sendLogin({ userId, restaurantId });
    }
  );

  fastify.post("/logout", {}, async (request, reply) => {
    await fastify.authenticateWithRestaurant(request, reply);
    
    return reply.sendLogin({ userId: request.user.id });
  });
}
