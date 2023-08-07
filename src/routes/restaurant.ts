import { FastifyInstance } from "../server";
import * as restaurantControl from "../controllers/restaurant";

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
        }
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
        summary: "Login into a restaurant",
        description: "Sets your session to a restaurant",
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
        }
      } as const
    },
    async (request, reply) => {
      const { id: restaurantId } = request.body;

      return reply.send(restaurantId);
    }
  );
}
