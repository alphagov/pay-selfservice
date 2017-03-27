#!/usr/bin/env groovy

pipeline {
  agent any

  options {
    ansiColor('xterm')
    timestamps()
  }

  libraries {
    lib("pay-jenkins-library@master")
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
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        deploy("selfservice", "test")
      }
    }
  }
}
