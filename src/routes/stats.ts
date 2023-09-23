import type { FastifyInstance } from "../server";
import * as statsControl from "../controllers/statistics";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/:restaurant/most-selled",
    {
      schema: {
        summary: "Get most selled products",
        tags: ["info"],
        params: {
          type: "object",
          properties: {
            restaurant: { type: "string", minLength: 3, maxLength: 255 }
          },
          required: ["restaurant"],
          additionalProperties: false
        }
      } as const
    },
    async (request, reply) => {
      return reply.send(
        await statsControl.mostSelled(request.params.restaurant)
      );
    }
  );
}
