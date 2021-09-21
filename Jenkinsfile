#!/usr/bin/env groovy

// @FIXME(sfount) temporary use of experimental jenkins-library branch - this
//                should be reverted to `master` before PR is merged 
pipeline {
  agent any

  parameters {
    booleanParam(defaultValue: false, description: '', name: 'runEndToEndTestsOnPR')
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
    JAVA_HOME="/usr/lib/jvm/java-1.11.0-openjdk-amd64"
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
      post { 
        always { 
          script {
            cypress.cleanUp()
          }
        }
      }
    }
    stage('Contract Tests') {
      steps {
        script {
          env.PACT_TAG = gitBranchName()
        }
        ws('contract-tests-wp') {
          runPactProviderTests("pay-adminusers", "${env.PACT_TAG}", "selfservice")
          runPactProviderTests("pay-connector", "${env.PACT_TAG}", "selfservice")
          runPactProviderTests("pay-products", "${env.PACT_TAG}", "selfservice")
          runPactProviderTests("pay-direct-debit-connector", "${env.PACT_TAG}", "selfservice")
          runPactProviderTests("pay-ledger", "${env.PACT_TAG}", "selfservice")
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
      stages {
        stage('End-to-End Tests') {
            when {
                anyOf {
                  branch 'master'
                  environment name: 'RUN_END_TO_END_ON_PR', value: 'true'
                }
            }
            steps {
                runAppE2E("selfservice", "card,products")
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
    stage('Check pact compatability') {
      failFast true
      when {
        branch 'master'
      }
      steps {
        checkPactCompatibility("selfservice", gitCommit(), "test")
      }
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
