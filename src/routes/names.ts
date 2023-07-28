import { FastifyInstance } from "..";
import nomes from "../assets/nomes.json";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      } as const
    },
    async (_, reply) => {
      return reply.send(Object.keys(nomes));
    }
  );

  fastify.get(
    "/:nome",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            nome: {
              type: "string",
              enum: Object.keys(nomes)
            }
          },
          required: ["nome"]
        },
        response: {
          200: {
            type: "object",
            properties: {
              nome: {
                type: "string"
              },
              sobrenome: {
                type: "string"
              },
              idade: {
                type: "number",
                minimum: 0
              },
              aniversario: {
                type: "string",
                format: "date",
                description: "Data de aniversário"
              }
            },
            required: ["nome", "sobrenome", "idade", "aniversario"]
          }
        }
      } as const
    },
    async (request, reply) => {
      const { nome } = request.params;
      return reply.send(nomes[nome as keyof typeof nomes]);
    }
  );
}
