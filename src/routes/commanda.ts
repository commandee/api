import type { FastifyInstance } from "../server";

import * as commandaControl from "../controllers/commanda";

export default async function (fastify: FastifyInstance) {
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
      fastify.authenticateWithRestaurant(request, reply);

      const commanda = request.body;
      const restaurantId = request.user.restaurantId!;
      
      await commandaControl.create(commanda, restaurantId);

      reply.status(201).send("Commanda created successfully");
    }
  );

  fastify.get(
    "/",
    {
      schema: {
        summary: "Get all commandas from the restaurant"
      } as const
    },
    async (request, reply) => {
      fastify.authenticateWithRestaurant(request, reply);

      const restaurant = request.user.restaurantId!;
      const commandas = await commandaControl.getAllFrom(restaurant);

      return reply.status(200).send(commandas);
    }
  );

  fastify.get("/:id", {
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
  }, async (request, reply) => {
    fastify.authenticateWithRestaurant(request, reply);

    const commanda = await commandaControl.get(request.params.id);

    return reply.send(commanda);
  });
}
