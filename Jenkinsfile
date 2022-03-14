#!/usr/bin/env groovy

pipeline {
  agent any

  parameters {
    string(name: 'CYPRESS_VERSION', defaultValue: '5.0.0', description: 'Cypress version number')
  }

  options {
    ansiColor('xterm')
    timestamps()
  }

  libraries {
    lib("pay-jenkins-library@master")
  }

  environment {
    CYPRESS_VERSION = "${params.CYPRESS_VERSION}"
    JAVA_HOME = "/usr/lib/jvm/java-1.11.0-openjdk-amd64"
  }

  stages {
    stage('Docker Build') {
      steps {
        script {
          buildMultistageAppWithMetrics {
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
