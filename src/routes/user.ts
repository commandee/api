import type { FastifyInstance } from "..";
import { Type } from "@sinclair/typebox";

export const prefix = "/user";

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/login",
    {
      schema: {
        body: Type.Object({
          username: Type.String({ minLength: 4, maxLength: 32 }),
          password: Type.String({ minLength: 8, maxLength: 32 })
        }),
        response: {
          200: Type.Object({
            logged: Type.Boolean()
          })
        },
        summary: "Login",
        tags: ["user", "login", "auth"],
        externalDocs: {
          url: "https://www.wikipedia.org/",
          description: "Find more info here"
        }
      } as const
    },
    async (request, reply) => {
      const { username, password } = request.body;

      const logged = username.length + password.length > 13;

      return reply.send({ logged });
    }
  );

  fastify.post(
    "/profile",
    {
      schema: {
        body: Type.Object({
          username: Type.String({ minLength: 4, maxLength: 32 }),
          password: Type.String({ minLength: 8, maxLength: 32 }),
          picture: Type.String({
            media: {
              binaryEncoding: "base64",
              type: "image/png"
            }
          })
        }),
        response: {
          200: Type.Object({
            logged: Type.Boolean(),
            username: Type.String()
          }),
          400: Type.Literal("Invalid password")
        }
      }
    },
    async (request, reply) => {
      const { username, password } = request.body;

      const logged = username.length + password.length > 13;

      return reply.send({ logged, username });
    }
  );
}
