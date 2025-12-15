FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose Vite port (from vite.config.js)
EXPOSE 9258

# Run dev server with --host to allow external access
CMD ["npm", "run", "dev", "--", "--host"]
