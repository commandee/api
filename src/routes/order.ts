import { FastifyInstance } from "../server";

export default async function(fastify: FastifyInstance) {
  fastify.post("/", {
    schema: {
      body: {
        
      }
    } as const
  }, async (request, reply) => {

  });
}
