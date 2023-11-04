import Fastify from "fastify";
import type {
  FastifyError,
  FastifyReply,
  FastifyRequest,
  FastifyTypeProvider
} from "fastify";
import * as path from "path";
import { fileURLToPath } from "url";
import type {
  FromSchema,
  FromSchemaOptions,
  FromSchemaDefaultOptions,
  JSONSchema7
} from "json-schema-to-ts";
import * as YAML from "js-yaml";
import * as fs from "fs/promises";
import router from "./router";
import * as userControl from "./controllers/employee";
import * as restaurantControl from "./controllers/restaurant";
import * as enviroment from "./enviroment";
import APIError from "./api_error";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface JsonSchemaToTsProvider<
  Options extends FromSchemaOptions = FromSchemaDefaultOptions
> extends FastifyTypeProvider {
  output: this["input"] extends JSONSchema7
    ? FromSchema<this["input"], Options>
    : unknown;
}

interface TypeProvider<
  Options extends FromSchemaOptions = FromSchemaDefaultOptions
> extends FastifyTypeProvider {
  output: this["input"] extends JSONSchema7
    ? FromSchema<this["input"], Options>
    : unknown;
}

const fastify = Fastify({
  ajv: {
    customOptions: {
      keywords: ["media"]
    },
    plugins: [(await import("@fastify/multipart")).ajvFilePlugin]
  }
}).withTypeProvider<TypeProvider>();

fastify.register(import("@fastify/cors"), {
  origin: ["http://localhost:5173"],
  credentials: true
});

fastify.register(import("@fastify/accepts"));

fastify.register(import("@fastify/static"), {
  root: import.meta.env.PROD ? __dirname : path.join(__dirname, ".."),
  wildcard: false,
  serve: false
});

fastify.register(import("@fastify/static"), {
  root: path.join(__dirname, import.meta.env.PROD ? "./public" : "../public"),
  wildcard: true,
  decorateReply: false
});

fastify.register(import("@fastify/cookie"), {
  secret: enviroment.COOKIE_SECRET
});

fastify.register(import("@fastify/jwt"), {
  secret: enviroment.JWT_SECRET,
  cookie: {
    cookieName: "token",
    signed: false
  },
  sign: {
    expiresIn: "2h"
  }
});

fastify.decorate(
  "authenticate",
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      const error = err as FastifyError;

      switch (error.code) {
        case "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED":
          return reply.code(403).send(error);

        default:
          return reply.code(401).send(error);
      }
    }
  }
);

fastify.decorate(
  "authenticateWithRestaurant",
  async function (request: FastifyRequest, reply: FastifyReply) {
    await fastify.authenticate(request, reply);

    if (!request.user.restaurant?.id) {
      throw new APIError("User is not logged in to a restaurant", 403);
    }
  }
);

fastify.decorateRequest("payload", async function (this: FastifyRequest) {
  const { userId, restaurantId } = (await this.jwtDecode()) as {
    userId: string;
    restaurantId?: string;
  };

  return { userId, restaurantId };
});

fastify.decorateRequest("fetchUser", async function (this: FastifyRequest) {
  const { id } = this.user;

  return await userControl.get(id);
});

fastify.decorateRequest(
  "fetchRestaurant",
  async function (this: FastifyRequest) {
    const { restaurant } = this.user;

    if (!restaurant) {
      throw new APIError("User is not logged in to a restaurant", 403);
    }

    return await restaurantControl.get(restaurant.id);
  }
);

fastify.decorateReply("sendLogin", async function(this: FastifyReply, { userId, restaurantId }: { userId: string; restaurantId?: string }) {
  const loginInfo = await userControl.info({
    userId,
    restaurantId
  });

  const token = await this.jwtSign({
    id: loginInfo.id,
    restaurant: loginInfo.restaurant && {
      id: loginInfo.restaurant.id,
      role: loginInfo.restaurant.role
    }
  });

  this.setCookie("token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: import.meta.env.PROD
  });

  this.header("Authorization", `Bearer ${token}`);

  return this.send(loginInfo);
});

fastify.register(import("@fastify/formbody"));
fastify.register(import("@fastify/multipart"), { addToBody: true });
fastify.addContentTypeParser(
  ["application/yaml", "application/yml", "text/yaml", "text/yml"],
  { parseAs: "string" },
  (_, body, done) => {
    try {
      done(null, YAML.load(body as string));
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  }
);

declare module "fastify" {
  interface FastifyReply {
    view: (element: JSX.Element) => FastifyReply;

    sendLogin: ({ userId, restaurantId }: { userId: string, restaurantId?: string }) => Promise<FastifyReply>;
  }

  interface FastifyRequest {
    payload: () => Promise<{ userId: string; restaurantId?: string }>;
    fetchRestaurant: () => Promise<{
      id: string;
      name: string;
      address: string;
    }>;
    fetchUser: () => Promise<{
      id: string;
      username: string;
      email: string;
    }>;
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;

    authenticateWithRestaurant: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

fastify.decorateReply("view", function (element: JSX.Element) {
  (this as unknown as FastifyReply).type("text/html");
  return this.send(element);
});

fastify.register(import("@fastify/swagger"), {
  openapi: {
    info: {
      title: "Fastify API",
      description: "Testing the Fastify openapi API",
      version: "0.1.0"
    },
    externalDocs: {
      url: "https://swagger.io",
      description: "Find more info here"
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server"
      }
    ]
  },
  prefix: "/documentation",
  transform: ({ schema, url }: { schema: any; url: string }) => {
    if (schema) {
      schema.consumes ??= [
        "application/json",
        "multipart/form-data",
        "text/yaml",
        "text/yml",
        "application/yaml",
        "application/yml",
        "application/x-www-form-urlencoded"
      ];

      schema.produces ??= ["application/json"];
    }

    return { schema, url };
  }
});

if (import.meta.env.DEV) {
  fastify.register(import("@fastify/swagger-ui"));
}

fastify.register(async (fastify: FastifyInstance) => {
  fastify.get(
    "/openapi",
    {
      schema: {
        summary: "OpenAPI Docs",
        description: "OpenAPI documentation for the API",
        tags: ["documentation"],
        produces: ["application/json", "text/yaml"],
        consumes: [
          "application/json",
          "text/yaml",
          "application/yaml",
          "text/yml"
        ]
      } as const
    },
    (request, reply) => {
      const validType =
        request.type([
          "application/json",
          "application/yaml",
          "text/yaml",
          "text/yml"
        ]) || "application/json";
      const type = Array.isArray(validType) ? validType[0] : validType;

      if (type === "application/json") {
        if (import.meta.env.PROD) {
          return reply.sendFile("/public/openapi.json");
        } else {
          return reply.type("application/json").send(openAPIJson);
        }
      } else {
        if (import.meta.env.PROD) {
          return reply.sendFile("/public/openapi.yaml");
        } else {
          return reply.type("text/yaml").send(openAPIYaml);
        }
      }
    }
  );

  fastify.get(
    "/openapi/json",
    {
      schema: {
        summary: "OpenAPI Docs JSON",
        hide: true,
        description: "OpenAPI documentation for the API in JSON format",
        consumes: ["application/json"],
        produces: ["application/json"],
        tags: ["documentation"]
      }
    },
    (_, reply) => {
      if (import.meta.env.PROD) {
        return reply.sendFile("/public/openapi.json");
      } else {
        return reply.type("application/json").send(openAPIJson);
      }
    }
  );

  fastify.get(
    "/openapi/yaml",
    {
      schema: {
        summary: "OpenAPI Docs YAML",
        hide: true,
        description: "OpenAPI documentation for the API in YAML format",
        consumes: ["application/yaml", "text/yaml", "text/yml"],
        produces: ["text/yaml"],
        tags: ["documentation"]
      }
    },
    (_, reply) => {
      if (import.meta.env.PROD) {
        return reply.sendFile("/public/openapi.yaml");
      } else {
        return reply.type("text/yaml").send(openAPIYaml);
      }
    }
  );

  if (import.meta.env.DEV) {
    fastify.get("/openapi.json", { schema: { hide: true } }, (_, reply) => {
      return reply.type("application/json").send(openAPIJson);
    });

    fastify.get("/openapi.yaml", { schema: { hide: true } }, (_, reply) => {
      return reply.type("text/yaml").send(openAPIYaml);
    });
  }
});

fastify.register(router);

await fastify.ready();

if (import.meta.env.PROD) {
  fs.writeFile(
    path.join(__dirname, "public/openapi.json"),
    JSON.stringify(fastify.swagger()),
    {
      encoding: "utf8"
    }
  );

  fs.writeFile(
    path.join(__dirname, "public/openapi.yaml"),
    fastify.swagger({ yaml: true }),
    {
      encoding: "utf8"
    }
  );

  const { PORT, HOST } = enviroment;

  fastify.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Server listening at ${address}`);
  });
} else {
  var openAPIJson = JSON.stringify(fastify.swagger());
  var openAPIYaml = fastify.swagger({ yaml: true });
}

export type FastifyInstance = typeof fastify;
export const viteNodeApp = fastify;
