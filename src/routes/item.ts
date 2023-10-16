import type { FastifyInstance } from "../server";
import * as itemControl from "../controllers/item"
import APIError from "../api_error";

export default async function(fastify: FastifyInstance) {
  fastify.get("/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            minLength: 16,
            maxLength: 16,
            description: "Public ID of the item"
          }
        },
        required: ["id"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "string", minLength: 16, maxLength: 16 },
            name: { type: "string", minLength: 3, maxLength: 255 },
            price: { type: "number", minimum: 0 },
            description: { type: "string", maxLength: 255 },
          },
          required: ["id", "name", "price"]
        }
      }
    } as const
  }, async (request, reply) => {
    await fastify.authenticateWithRestaurant(request, reply);

    const itemId = request.params.id;
    const item = await itemControl.get(itemId);

    if (item.restaurantId !== request.user.restaurant!.id) {
      throw new APIError("You don't have access to this item", 403);
    }

    return reply.send(item);
  });
}
