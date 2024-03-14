FROM node:16-alpine

ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --silent

# Bundle app source
COPY . .

EXPOSE 8000

CMD ["node", "dokumentasi.js"]