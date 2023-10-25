import APIError from "../api_error";
import * as employeeControl from "../controllers/employee";
import type { FastifyInstance } from "../server";

export default async function(fastify: FastifyInstance) {
  fastify.get(
    "/employees",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", minLength: 16, maxLength: 16 },
                username: { type: "string", minLength: 3, maxLength: 255 },
                email: { type: "string", format: "email", maxLength: 255 },
                role: { type: "string", enum: ["admin", "employee"] }
              },
              required: ["id", "username", "email", "role"]
            }
          }
        }
      }
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { role, id: restaurantId } = request.user.restaurant!;

      if (role !== "admin")
        throw new APIError("Only admins can see employees", 403);

      const employees = await employeeControl.getEmployees(restaurantId);

      return reply.send(employees);
    }
  );

  fastify.get("/employee/count", {
    schema: {
      response: {
        200: {
          type: "number",
          description: "Number of employees"
        }
      }
    }
  }, async (request, reply) => {
    await fastify.authenticateWithRestaurant(request, reply);

    const { role, id: restaurantId } = request.user.restaurant!;

    if (role !== "admin")
      throw new APIError("Only admins can see employees", 403);

    const count = await employeeControl.countEmployees(restaurantId);

    return reply.send(count);
  });
}
