# 1/2 Create build image
FROM node:10-alpine AS build

RUN mkdir -p /opt/geoplatform-web
WORKDIR /opt/geoplatform-web

COPY package.json yarn.lock ./
RUN yarn --production --frozen-lockfile

# 2/2 Create production image
FROM node:10-alpine

RUN mkdir -p /opt/geoplatform-web
WORKDIR /opt/geoplatform-web

COPY --from=build /opt/geoplatform-web .
COPY . .

ENV NODE_ENV=production \
    SENTRY_DSN_FILE=sentry_dsn

RUN mkdir -p /opt/bin
COPY docker/scripts/entrypoint.sh /opt/bin/

EXPOSE 5000
ENTRYPOINT ["/opt/bin/entrypoint.sh"]
CMD ["node", "server.js"]
