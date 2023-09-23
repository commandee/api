import type { FastifyInstance } from "./server";

export default async function (fastify: FastifyInstance) {
  const routes = import.meta.glob("./routes/**/*.{ts,js,tsx,jsx}", {
    eager: true
  });

  await Promise.all(
    Object.entries(routes).map(async ([path, route]) => {
      const routeModule = route as {
        default: (fastify: FastifyInstance) => Promise<void>;
        prefix?: string;
      };
      const prefix =
        routeModule.prefix ?? path.match(/^\.\/routes(.*?)(?:\/index)?\.(?:ts|js|jsx|tsx)$/)![1];

      await fastify.register(routeModule.default, { prefix });
    })
  );
}
