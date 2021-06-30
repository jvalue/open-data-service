const Docker = require('dockerode')

const { DOCKER_COMPOSE_FILE, DOCKER_ENV_FILE } = require('./util/env')
const { DockerCompose } = require('./util/docker-compose')
const { waitForServicesToBeReady } = require('./util/waitForServices')

async function setupTestEnv () {
  const dockerCompose = DockerCompose(DOCKER_COMPOSE_FILE, DOCKER_ENV_FILE)
  const docker = new Docker({})

  if ((await docker.listContainers()).length !== 0) {
    throw Error('Can not execute restart test if other containers are running')
  }

  // Do not try to build the images because then timing is really hard
  await dockerCompose('up -d --no-build mock-server')
  await dockerCompose('up -d --no-build adapter-db notification-db pipeline-db storage-db')
  await dockerCompose('up -d --no-build storage-db-liquibase')
  await dockerCompose('up -d --no-build adapter notification pipeline scheduler storage storage-mq')
  await dockerCompose('up -d --no-build edge') // Do not start edge with the other services, as then traefik sometime does not get all docker events
  await waitForServicesToBeReady()
}

module.exports = setupTestEnv
