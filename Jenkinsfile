#!/usr/bin/env groovy

pipeline {
  agent any

  parameters {
    booleanParam(defaultValue: true, description: '', name: 'runEndToEndOnPR')
  }

  options {
    ansiColor('xterm')
    timestamps()
  }

  libraries {
    lib("pay-jenkins-library@master")
  }

  environment {
    RUN_END_TO_END_ON_PR = "${params.runEndToEndOnPR}"
  }

  stages {
    stage('Docker Build') {
      steps {
        script {
          buildAppWithMetrics {
            app = "selfservice"
          }
        }
      }
      post {
        failure {
          postMetric("selfservice.docker-build.failure", 1)
        }
      }
    }
    stage('Test') {
      when {
        anyOf {
          branch 'master'
          environment name: 'RUN_END_TO_END_ON_PR', value: 'true'
        }
      }
      steps {
        runEndToEnd("selfservice")
        runParameterisedEndToEnd("selfservice", null, "end2end-tagged", false, false, "uk.gov.pay.endtoend.categories.End2EndProducts")
      }
    }
    stage('Docker Tag') {
      steps {
        script {
          dockerTagWithMetrics {
            app = "selfservice"
          }
        }
      }
      post {
        failure {
          postMetric("selfservice.docker-tag.failure", 1)
        }
      }
    }
    stage('Deploy') {
      when {
        branch 'master'
      }
      steps {
        deployEcs("selfservice", "test", null, true, true)
      }
    }
  }
  post {
    failure {
      postMetric(appendBranchSuffix("selfservice") + ".failure", 1)
    }
    success {
      postSuccessfulMetrics(appendBranchSuffix("selfservice"))
    }
  }
}
