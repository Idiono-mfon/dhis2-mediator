FROM node:18

RUN npm install -g -f yarn

# Create App Directory
WORKDIR /home/openhim-dhis2-fhir-mediator

COPY package*.json ./

RUN yarn

COPY . .

RUN yarn tsc

# RUN yarn mg:latest

# RUN yarn mg:latest && yarn seed:run

EXPOSE 9078

CMD ["node", "dist/main.js"]

