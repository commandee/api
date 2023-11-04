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

      if (request.user.restaurant!.role !== "admin")
        throw new APIError(
          "You don't have permission to dismiss employees",
          403
        );

      const { id: employeeId } = request.params;
      const { id: restaurantId } = request.user.restaurant!;

      await restaurantControl.dismiss(employeeId, restaurantId);

      return reply.send("Employee dismissed successfully.");
    }
  );

  fastify.patch(
    "/promote",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the user"
            }
          },
          required: ["userId"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      if (request.user.restaurant!.role !== "admin")
        throw new APIError(
          "You don't have permission to promote employees",
          403
        );

      const { userId } = request.body;
      const { id: restaurantId } = request.user.restaurant!;

      await restaurantControl.setRole(userId, restaurantId, "admin");

      return reply.send("Employee promoted successfully.");
    }
  );

  fastify.patch(
    "/role",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the user"
            },
            role: { type: "string", enum: ["admin", "employee"] }
          },
          required: ["role", "userId"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      const { role, userId } = request.body;
      const { id: restaurantId } = request.user.restaurant!;

      await restaurantControl.setRole(userId, restaurantId, role);

      return reply.send("Role changed successfully.");
    }
  );

  fastify.patch(
    "/demote",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            employeeId: {
              type: "string",
              minLength: 16,
              maxLength: 16,
              description: "Public ID of the user"
            }
          },
          required: ["employeeId"]
        }
      } as const
    },
    async (request, reply) => {
      await fastify.authenticateWithRestaurant(request, reply);

      if (request.user.restaurant!.role !== "admin")
        throw new APIError(
          "You don't have permission to demote employees",
          403
        );

      const { employeeId } = request.body;
      const { id: restaurantId } = request.user.restaurant!;

      await restaurantControl.setRole(employeeId, restaurantId, "employee");

      return reply.send("Employee demoted successfully.");
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
