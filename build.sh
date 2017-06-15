#!/usr/bin/env bash
set -x -e

docker build -t "$1"/node:4.5.0-2 -t "$1"/node:4.5-2 -t "$1"/node:4-2 4.5
docker build -t "$1"/node:4.8.3 -t "$1"/node:4.8 -t "$1"/node:4 4.8
docker build -t "$1"/node:6.11.0 -t "$1"/node:6.11 -t "$1"/node:6 -t "$1"/node:lts 6.11
docker build -t "$1"/node:8.0.0 -t "$1"/node:8.0 8.0.0
docker build -t "$1"/node:8.1.0 -t "$1"/node:8.1 -t "$1"/node:8 -t "$1"/node:latest 8.1.0

docker login -u "$2" -p "$3"

docker push "$1"/node:4.5.0-2
docker push "$1"/node:4.5-2
docker push "$1"/node:4-2

docker push "$1"/node:4.8.3
docker push "$1"/node:4.8
docker push "$1"/node:4

docker push "$1"/node:6.11.0
docker push "$1"/node:6.11
docker push "$1"/node:6
docker push "$1"/node:lts

docker push "$1"/node:8.0.0
docker push "$1"/node:8.0

docker push "$1"/node:8.1.0
docker push "$1"/node:8.1
docker push "$1"/node:8
docker push "$1"/node:latest

docker logout