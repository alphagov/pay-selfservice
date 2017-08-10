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
          sh 'echo $\'git diff --name-only origin/master |\' $(cat .buildignore | awk \'{ print "grep -v " $1 " | " }\' | tr -d \'\\n\\r\' | rev | cut -c3- | rev)  \' | wc -l\'  > cmd.tmp'
          FILES_WITH_TESTABLE_CODE = sh (
                  script: 'source cmd.tmp',
                  returnStdout: true
          ).trim()

          if (FILES_WITH_TESTABLE_CODE > 0) {
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
