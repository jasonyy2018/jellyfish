FROM node:22-alpine

WORKDIR /app
COPY . .

RUN npm install && npm run prisma:generate && npm run build

EXPOSE 3000 3001 3002
CMD ["npm", "run", "start:dashboard"]
