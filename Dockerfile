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

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
CMD ["npm", "start"]
EXPOSE $PORT
