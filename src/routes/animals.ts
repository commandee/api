import { Type } from "@sinclair/typebox";
import { FastifyInstance } from "..";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "",
    {
      schema: {
        response: {
          200: Type.Array(
            Type.Object({
              name: Type.String(),
              legs: Type.Number({
                minimum: 0,
                maximum: 4
              })
            })
          )
        }
      }
    },
    async (_request, reply) => {
      return reply.send([
        {
          name: "cat",
          legs: 4
        },
        {
          name: "dog",
          legs: 4
        }
      ]);
    }
  );
}
