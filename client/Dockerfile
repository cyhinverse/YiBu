
# stage 1
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copy client source (must be within build context: ./client)
COPY . .

RUN npm run build


# stage 2
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]




