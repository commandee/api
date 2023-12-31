import type { FastifyInstance } from "../server";

import * as commandaControl from "../controllers/commanda";
import * as orderControl from "../controllers/order";
import APIError from "../api_error";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        summary: "Get all commandas from the restaurant",
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const restaurant = request.user.restaurant!.id;
      const commandas = await commandaControl.getAll(restaurant);

      return reply.status(200).send(commandas);
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get commanda by ID",
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the commanda"
            }
          },
          required: ["id"],
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const commanda = await commandaControl.get(request.params.id);

      if (commanda.restaurantId != request.user!.restaurant?.id)
        throw new APIError("Você não tem acesso a essa commanda.", 403);

      return reply.send(commanda);
    }
  );

  fastify.get("/:id/orders", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            minLength: 16,
            maxLength: 16,
            description: "Public ID of the commanda"
          },
        },
        required: ["id"],
        additionalProperties: false
      }
    } as const
  }, async (request, reply) => {
    await fastify.authenticateWithRestaurant(request, reply);

    const commandaId = request.params.id;
    const commanda = await commandaControl.get(commandaId);

    if (commanda.restaurantId != request.user.restaurant!.id)
      throw new APIError("Você não tem acesso a essa commanda.", 403);

    const orders = await commandaControl.getOrders(commandaId);

    return reply.send(orders);
  });

  fastify.post(
    "/",
    {
      schema: {
        summary: "Create a new commanda",
        body: {
          type: "object",
          properties: {
            costumer: {
              type: "string",
              minLength: 2,
              maxLength: 255,
              examples: ["Isa", "Nacrai"]
            },
            table: {
              type: "integer",
              minimum: 1,
              maximum: 255,
              description: "Number of the table for the commanda (optional)",
              nullable: true
            }
          },
          required: ["costumer"],
          additionalProperties: false
        },
        response: {
          201: {
            type: "string",
            description: "Commanda created successfully"
          }
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const commanda = request.body;
      const restaurantId = request.user.restaurant!.id;

      await commandaControl.create(commanda, restaurantId);

      reply.status(201).send("Commanda created successfully");
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        summary: "Delete a commanda",
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the commanda"
            }
          },
          required: ["id"],
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const commandaId = request.params.id;
      const commanda = await commandaControl.get(commandaId);

      if (commanda.restaurantId != request.user.restaurant?.id)
        throw new APIError("Você não tem acesso a essa commanda.", 403);

      await commandaControl.del(commandaId);

      return reply.send("Commanda deleted successfully");
    }
  );
}
