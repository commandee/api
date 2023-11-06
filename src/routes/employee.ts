import APIError from "../api_error";
import * as employeeControl from "../controllers/employee";
import * as restaurantControl from "../controllers/restaurant";
import * as userControl from "../controllers/employee";
import type { FastifyInstance } from "../server";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
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

      const employees = await employeeControl.getAllFrom(restaurantId);

      return reply.send(employees);
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        summary: "Get user by public ID",
        tags: ["user"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", minLength: 16, maxLength: 16 }
          },
          required: ["id"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", minLength: 16, maxLength: 16 },
              username: { type: "string", minLength: 3, maxLength: 255 },
              email: { type: "string", format: "email", maxLength: 255 },
              role: { type: "string", enum: ["admin", "employee"] }
            },
            required: ["id", "username", "email", "role"],
            additionalProperties: false
          }
        },
        produces: ["application/json", "text/plain"]
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { id } = request.params;

      if (id !== request.user.id && request.user.restaurant?.role !== "admin") {
        throw new APIError(
          "You cannot see users other than yourself or your employees",
          403
        );
      }

      const [user, role] = await Promise.all([
        userControl.get(id),
        restaurantControl.isEmployee(id, request.user.restaurant!.id)
      ]);

      return reply.send({
        ...user,
        role
      });
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            employeeId: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the employee"
            },
            role: { type: "string", enum: ["admin", "employee"] }
          },
          required: ["employeeId"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      if (request.user.restaurant!.role !== "admin")
        throw new APIError("You don't have permission to add employees", 403);

      const { employeeId, role } = request.body;
      const { id: restaurantId } = request.user.restaurant!;

      await restaurantControl.addEmployment(employeeId, restaurantId, role);

      return reply.send("Employee added successfully.");
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the user"
            }
          },
          required: ["id"]
        },
        body: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["admin", "employee"] }
          },
          required: ["role"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { id: employeeId } = request.params;
      const { role } = request.body;

      if (request.user.restaurant!.role !== "admin")
        throw new APIError("You don't have permission to edit employees", 403);

      await restaurantControl.setRole(
        employeeId,
        request.user.restaurant!.id,
        role
      );

      return reply.send("Employee updated successfully.");
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the user"
            }
          },
          required: ["id"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { id: employeeId } = request.params;
      const { id: restaurantId } = request.user.restaurant!;

      if (employeeId === request.user.id)
        throw new APIError("You cannot dismiss yourself", 403);

      if (request.user.restaurant!.role !== "admin")
        throw new APIError(
          "You don't have permission to dismiss employees",
          403
        );

      await restaurantControl.dismiss(employeeId, restaurantId);

      return reply.send("Employee dismissed successfully.");
    }
  );

  fastify.get(
    "/count",
    {
      schema: {
        response: {
          200: {
            type: "number",
            description: "Number of employees"
          }
        }
      }
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { role, id: restaurantId } = request.user.restaurant!;

      if (role !== "admin")
        throw new APIError("Only admins can see employees", 403);

      const count = await employeeControl.countEmployees(restaurantId);

      return reply.send(count);
    }
  );
}
