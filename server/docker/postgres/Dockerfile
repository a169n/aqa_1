FROM postgres:16-alpine

COPY server/docker/postgres/init-multiple-databases.sh /docker-entrypoint-initdb.d/01-init-multiple-databases.sh

RUN chmod +x /docker-entrypoint-initdb.d/01-init-multiple-databases.sh
