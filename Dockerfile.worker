# 1/2 Create build image
FROM node:10-alpine AS build

RUN mkdir -p /opt/geoplatform-worker
WORKDIR /opt/geoplatform-worker

COPY package.json yarn.lock ./
RUN yarn --production --frozen-lockfile

# 2/2 Create production image
FROM node:10-alpine

RUN mkdir -p /opt/geoplatform-worker
WORKDIR /opt/geoplatform-worker

COPY --from=build /opt/geoplatform-worker .
COPY . .

ENV NODE_ENV=production \
    SENTRY_DSN_FILE=sentry_dsn

RUN mkdir -p /opt/bin
COPY docker/scripts/entrypoint.sh /opt/bin/

EXPOSE 5000
ENTRYPOINT ["/opt/bin/entrypoint.sh"]
CMD ["node", "worker.js"]
