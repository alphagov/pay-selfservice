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
        script {
          try {
            sh 'git diff --name-only origin/master | grep -v docs/ | grep -v Jenkinsfile | grep -e ^[docs/|Jenkinsfile]'
            HAS_CODE_CHANGES = true
          }
          catch (error) {
            HAS_CODE_CHANGES = false
          }
          if (HAS_CODE_CHANGES) {
            runEndToEnd("selfservice")
          }
        }
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
