import { Type } from "@sinclair/typebox";
import { FastifyInstance } from "..";

export const prefix = "/fruit";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(
            Type.Object({
              name: Type.Union([Type.Literal("apple"), Type.Literal("banana")]),
              color: Type.Union([Type.Literal("red"), Type.Literal("yellow")])
            })
          )
        }
      }
    },
    (_request, reply) => {
      reply.send([
        {
          name: "apple",
          color: "red"
        },
        {
          name: "banana",
          color: "yellow"
        }
      ]);
    }
  );

  fastify.get(
    "/:name",
    {
      schema: {
        params: Type.Object({
          name: Type.Union([Type.Literal("apple"), Type.Literal("banana")])
        }),
        response: {
          200: {
            type: "object",
            properties: {
              name: {
                type: "string",
                enum: ["apple", "banana"]
              },
              color: {
                type: "string",
                enum: ["red", "yellow"]
              }
            },
            required: ["name"]
          }
        }
      } as const
    },
    (request, reply) => {
      const { name } = request.params;
      const color = name === "apple" ? "red" : "yellow";

      reply.send({ name, color });
    }
  );
}
