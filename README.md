# geoplatform [![CircleCI](https://circleci.com/gh/geodatagouv/geoplatform.svg?style=svg)](https://circleci.com/gh/geodatagouv/geoplatform)

> Core API and processing tools for geo.data.gouv.fr

[![Last Release](https://badgen.net/github/release/geodatagouv/geoplatform/stable)](https://github.com/geodatagouv/geoplatform/releases)
[![dependencies Status](https://badgen.net/david/dep/geodatagouv/geoplatform)](https://david-dm.org/geodatagouv/geoplatform)
[![codecov](https://badgen.net/codecov/c/github/geodatagouv/geoplatform)](https://codecov.io/gh/geodatagouv/geoplatform)
[![XO code style](https://badgen.net/badge/code%20style/XO/cyan)](https://github.com/xojs/xo)

### Services

This exposes two services:

- A web service that you can run using `yarn start:web`.
- A worker service that you can run using `yarn start:worker`.

## Docker

Both services are available as docker images:

### Web service

[![Docker Pulls](https://badgen.net/docker/pulls/geodatagouv/geoplatform-web?icon=docker)](https://hub.docker.com/r/geodatagouv/geoplatform-web)

```bash
$ docker pull geodatagouv/geoplatform-web:latest
```

### Worker service

[![Docker Pulls](https://badgen.net/docker/pulls/geodatagouv/geoplatform-worker?icon=docker)](https://hub.docker.com/r/geodatagouv/geoplatform-worker)

```bash
$ docker pull geodatagouv/geoplatform-worker:latest
```
