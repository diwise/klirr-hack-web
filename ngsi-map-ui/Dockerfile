# Build stage
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_NGSI_BASE_URL=https://klirr.diwise.io
ARG VITE_NGSI_CONTEXT=https://raw.githubusercontent.com/diwise/context-broker/refs/heads/main/assets/jsonldcontexts/default-context.jsonld
ARG VITE_NGSI_USE_MOCK=false

ENV VITE_NGSI_BASE_URL=$VITE_NGSI_BASE_URL
ENV VITE_NGSI_CONTEXT=$VITE_NGSI_CONTEXT
ENV VITE_NGSI_USE_MOCK=$VITE_NGSI_USE_MOCK

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
