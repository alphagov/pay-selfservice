#!/usr/bin/env groovy

pipeline {
  agent any

  options {
    ansiColor('xterm')
    timestamps()
  }

  libraries {
    lib("pay-jenkins-library@PP-2497_decrease_frontend_image_size")
  }

  stages {
    stage('Docker Build') {
      steps {
        script {
          buildApp{
            app = "selfservice"
          }
        }
      }
    }
    stage('Test') {
      steps {
        runEndToEnd("selfservice")
      }
    }
    stage('Docker Tag') {
      steps {
        script {
          dockerTag {
            app = "selfservice"
          }
        }
      }
    }
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        deploy("selfservice", "test", null, true)
      }
    }
  }
}
