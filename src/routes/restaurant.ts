import type { FastifyInstance } from "../server";
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
      } as const
    },
    async (request, reply) => {
      const { userId } = request.user;
      const { id: restaurantId } = request.body;

      const payload = await restaurantControl.login({ userId, restaurantId });
      const token = await reply.jwtSign(payload);

      reply.setCookie("token", token, {
        path: "/",
        httpOnly: true,
        sameSite: true,
        secure: true
      });

      reply.send(token);
    }
  );
}
