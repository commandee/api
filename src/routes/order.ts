import type { FastifyInstance } from "../server";
import * as orderControl from "../controllers/order";

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            order: {
              type: "object",
              properties: {
                notes: { type: "string", maxLength: 255 },
                quantity: { type: "number", minimum: 1, default: 1 },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                  default: "low"
                },
                status: {
                  type: "string",
                  enum: ["pending", "in_progress", "done"],
                  default: "pending"
                },
                itemId: { type: "string", minLength: 16, maxLength: 16 }
              },
              required: ["itemId"],
              additionalProperties: false
            },
            commandaId: { type: "string", minLength: 16, maxLength: 16 }
          },
          required: ["order", "commandaId"]
        }
      } as const,
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      await orderControl.create(request.body.order, request.body.commandaId);
      return reply.send("Order placed successfully");
    }
  );
}
