FROM node:alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM node:alpine

ARG HOST=0.0.0.0
ENV HOST $HOST

ARG PORT=3000
ENV PORT $PORT

ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL

ARG JWT_SECRET
ENV JWT_SECRET $JWT_SECRET

ENV NODE_ENV production

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
CMD ["npm", "start"]
EXPOSE $PORT
