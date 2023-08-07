import { FastifyInstance } from "../server";

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
            },
            restaurant: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the restaurant"
            }
          },
          required: ["costumer", "restaurant"],
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
      const commanda = request.body;
      await commandaControl.create(commanda);

      reply.status(201).send("Commanda created successfully");
    }
  );

  fastify.get(
    "/restaurant/:restaurant",
    {
      schema: {
        summary: "Get all commandas from a restaurant",
        params: {
          type: "object",
          properties: {
            restaurant: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the restaurant"
            }
          },
          required: ["restaurant"],
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      const { restaurant } = request.params;
      const commandas = await commandaControl.getAllFrom(restaurant);

      reply.status(200).send(commandas);
    }
  );
}
