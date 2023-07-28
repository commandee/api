import { FastifyInstance } from "../..";

export default async function (fastify: FastifyInstance) {
  fastify.get("/", async (_, reply) => {
    reply.send("rota no indice");
  });

  fastify.get("/teste", (_, reply) => {
    reply.send("rota no teste");
  });
}
