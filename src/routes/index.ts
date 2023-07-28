import { Type } from "@sinclair/typebox";
import { FastifyInstance } from "..";

import engual from "../assets/engual.jpg";
import musica from "../assets/musica.jpg";

export default async function (fastify: FastifyInstance) {
  fastify.get("/", async (_, reply) => {
    return reply.send("Hello World!");
  });

  fastify.post(
    "/password/:user",
    {
      schema: {
        params: Type.Object({
          user: Type.Union([Type.Literal("admin"), Type.Literal("user")])
        }),
        body: Type.Object({
          password: Type.String({ minLength: 8, maxLength: 32 })
        }),
        response: {
          200: Type.Object({
            user: Type.Union([Type.Literal("admin"), Type.Literal("user")]),
            password: Type.String({ minLength: 8, maxLength: 32 })
          }),
          400: Type.Literal("Invalid password")
        }
      }
    },
    async (request, _reply) => {
      const { password } = request.body;
      const { user } = request.params;

      return {
        password,
        user
      };
    }
  );

  fastify.get("/tristeza", (_, reply) => {
    return reply.sendFile(engual);
  });

  fastify.get("/musica", async (_, reply) => {
    return reply.sendFile(musica);
  });

  fastify.get("/confiavel", {}, (_, reply) => {
    return reply.sendFile("./public/virus.py");
  });
}
