import type { FastifyInstance } from "../server";
import * as orderControl from "../controllers/order";
import * as itemControl from "../controllers/item";
import APIError from "../api_error";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        description: "Get all orders from the restaurant",
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["pending", "in_progress", "done"],
              description: "Filter by status"
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Filter by priority"
            },
            orderBy: {
              type: "string",
              enum: ["status", "priority", "quantity", "createdAt"],
              description: "Order by this field"
            },
            order: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Order direction"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "Maximum number of orders to return"
            }
          },
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      return reply.send(
        await orderControl.getAllFrom(request.user.restaurant!.id, {
          ...request.query,
          where: {
            status: request.query.status,
            priority: request.query.priority
          }
        })
      );
    }
  );

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
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      if (
        request.user?.restaurant?.id !=
        (await itemControl.get(request.body.order.itemId)).restaurantId
      )
        throw new APIError("You don't have access to this item", 403);

      await orderControl.create(request.body.order, request.body.commandaId);
      return reply.send("Order placed successfully");
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the order"
            }
          },
          required: ["id"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const order = await orderControl.get(request.params.id);

      if (order.restaurantId !== request.user.restaurant!.id)
        throw new APIError("You don't have access to this order", 403);

      return reply.send(order);
    }
  );
}
