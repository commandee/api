import type { FastifyInstance } from "../server";

import * as commandaControl from "../controllers/commanda";
import APIError from "../api_error";

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
      await fastify.authenticateWithRestaurant(request, reply);

      const commanda = request.body;
      const restaurantId = request.user.restaurant!.id;

      await commandaControl.create(commanda, restaurantId);

      reply.status(201).send("Commanda created successfully");
    }
  );

  fastify.get(
    "/",
    {
      schema: {
        summary: "Get all commandas from the restaurant",
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                costumer: {
                  type: "string",
                  minLength: 2,
                  maxLength: 255
                },
                table: {
                  type: "integer",
                  minimum: 1,
                  maximum: 255,
                  description:
                    "Number of the table for the commanda (optional)",
                  nullable: true
                },
                id: {
                  type: "string",
                  minLength: 16,
                  maxLength: 16,
                  description: "Public ID of the commanda"
                }
              },
              required: ["costumer", "id"],
              additionalProperties: false
            }
          }
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const restaurant = request.user.restaurant!.id;
      const commandas = await commandaControl.getAllFrom(restaurant);

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
}
