(function () {
  'use strict'

  var path = require('path')
  var fs = require('fs')
  var logger = require('winston')
  var throng = require('throng')
  var server = require('./server')
  var environment = require('./app/services/environment')
  var pidFile = path.join(__dirname, '/.start.pid')
  var fileOptions = { encoding: 'utf-8' }
  var pid

  /**
   * throng is a wrapper around node cluster
   * https://github.com/hunterloftis/throng
   */
  function start () {
    throng({
      workers: environment.getWorkerCount(),
      master: startMaster,
      start: startWorker
    })
  }

  /**
   * Start master process
   */
  function startMaster () {
    logger.info(`Master started. PID: ${process.pid}`)
    process.on('SIGINT', () => {
      logger.info(`Master exiting`)
      process.exit()
    })
  }

  /**
   * Start cluster worker. Log start and exit
   * @param  {Number} workerId
   */
  function startWorker (workerId) {
    server.start()

    logger.info(`Started worker ${workerId}, PID: ${process.pid}`)

    process.on('SIGINT', () => {
      logger.info(`Worker ${workerId} exiting...`)
      process.exit()
    })
  }

  /**
   * Make sure all child processes are cleaned up
   */
  function onInterrupt () {
    pid = fs.readFileSync(pidFile, fileOptions)
    fs.unlink(pidFile)
    process.kill(pid, 'SIGTERM')
    process.exit()
  }

  /**
   * Keep track of processes, and clean up on SIGINT
   */
  function monitor () {
    fs.writeFileSync(pidFile, process.pid, fileOptions)
    process.on('SIGINT', onInterrupt)
  }

  monitor()

  start()
}())
