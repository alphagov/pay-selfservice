#!/usr/bin/env groovy

pipeline {
  agent any

  parameters {
    booleanParam(defaultValue: true, description: '', name: 'runEndToEndTestsOnPR')
    booleanParam(defaultValue: false, description: '', name: 'runAcceptTestsOnPR')
  }

  options {
    ansiColor('xterm')
    timestamps()
  }

  libraries {
    lib("pay-jenkins-library@master")
  }

  environment {
    RUN_END_TO_END_ON_PR = "${params.runEndToEndTestsOnPR}"
    RUN_ACCEPT_ON_PR = "${params.runAcceptTestsOnPR}"
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
    stage('Tests') {
      failFast true
      parallel {
        stage('Card Payment End-to-End Tests') {
            when {
                anyOf {
                  branch 'master'
                  environment name: 'RUN_END_TO_END_ON_PR', value: 'true'
                }
            }
            steps {
                runCardPaymentsE2E("selfservice")
            }
        }
        stage('Products End-to-End Tests') {
            when {
                anyOf {
                  branch 'master'
                  environment name: 'RUN_END_TO_END_ON_PR', value: 'true'
                }
            }
            steps {
                runProductsE2E("selfservice")
            }
        }
        stage('Direct-Debit End-to-End Tests') {
            when {
                anyOf {
                  branch 'master'
                  environment name: 'RUN_END_TO_END_ON_PR', value: 'true'
                }
            }
            steps {
                runDirectDebitE2E("selfservice")
            }
        }
        stage('Accept Tests') {
            when {
                anyOf {
                  branch 'master'
                  environment name: 'RUN_ACCEPT_ON_PR', value: 'true'
                }
            }
            steps {
                runAccept("selfservice")
            }
        }
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
        deployEcs("selfservice")
      }
    }
    stage('Direct Debit Smoke Test') {
      when { branch 'master' }
      steps { runDirectDebitSmokeTest() }
    }
    stage('Complete') {
      failFast true
      parallel {
        stage('Tag Build') {
          when {
            branch 'master'
          }
          steps {
            tagDeployment("selfservice")
          }
        }
        stage('Trigger Deploy Notification') {
          when {
            branch 'master'
          }
          steps {
            triggerGraphiteDeployEvent("selfservice")
          }
        }
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
