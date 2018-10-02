#!/usr/bin/env sh

export_docker_secrets() {
  local SENTRY_DSN_FILE="/run/secrets/$SENTRY_DSN_FILE"

  if [ -f $SENTRY_DSN_FILE ]; then
    export SENTRY_DSN="$(cat "$SENTRY_DSN_FILE")"
  fi
}

export_docker_secrets

exec "$@"
