FROM node:20
COPY . .
RUN npm ci
RUN npm run build
CMD node dist/app.js