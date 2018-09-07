#!/usr/bin/env groovy
// Nothing has changed
pipeline {
  agent any

  parameters {
    booleanParam(defaultValue: true, description: '', name: 'runEndToEndTestsOnPR')
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
    stage('Browser Tests') {
      steps {
        cypress('selfservice')
      }
    }
    stage('Contract Tests') {
      steps {
        script {
          env.PACT_TAG = gitBranchName()
        }
        ws('contract-tests-wp') {
          runPactProviderTests("pay-adminusers", "${env.PACT_TAG}")
          runPactProviderTests("pay-connector", "${env.PACT_TAG}")
        }
      }
      post {
        always {
          ws('contract-tests-wp') {
            deleteDir()
          }
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
      failFast true
      when {
        branch 'master'
      }
      steps {
        checkPactCompatibility("selfservice", gitCommit(), "test")
        deployEcs("selfservice")
      }
    }
    stage('Direct Debit Smoke Test') {
      when { branch 'master' }
      steps { runDirectDebitSmokeTest() }
    }
    stage('Pact Tag') {
      when {
        branch 'master'
      }
      steps {
        echo 'Tagging consumer pact with "test"'
        tagPact("selfservice", gitCommit(), "test")
      }
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
