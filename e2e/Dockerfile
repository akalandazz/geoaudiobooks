FROM mcr.microsoft.com/playwright:v1.60.0-noble
WORKDIR /e2e
COPY package.json .
RUN npm install
COPY . .
