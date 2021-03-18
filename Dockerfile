FROM node:14.15.4-alpine3.12

RUN mkdir -p /app/ && chown -R node:node /app/

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

USER node

COPY --chown=node:node / /app/

RUN npm install && npm run lint && npm run test

COPY --chown=node:node . .

USER root

# install curl and node-prune, execute node prune and remove unused packages

RUN apk --no-cache add curl && curl -sf https://gobinaries.com/tj/node-prune | sh \
    && node-prune && apk del curl && cd /usr/local/bin/ \
    && rm -rf node-prune && cd .. && cd /app/ && rm package-lock.json 

USER node

# edit to reflect the build command in package.json
RUN npm run build:app

EXPOSE 5000

ENV HOST=0.0.0.0

ENV PORT=5000

# edit to reflect the run command in package.json
CMD [ "npm", "run", "serve" ]