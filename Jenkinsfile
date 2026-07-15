// Jenkins pipeline for the AI-SDLC demo app (this repo's root).
// Stage 5 (/sdlc:run-ci) triggers this job with a BRANCH parameter; it checks out
// that branch, runs the Playwright suite, and publishes JUnit results so the merge
// gate can read an authoritative pass/fail for the exact commit.

pipeline {
  agent any

  parameters {
    string(name: 'BRANCH', defaultValue: 'main', description: 'Feature branch to test')
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
  }

  environment {
    DEMO_APP_PORT = '3000'
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "*/${params.BRANCH}"]],
          userRemoteConfigs: scm.userRemoteConfigs
        ])
      }
    }

    stage('Install') {
      steps {
        sh 'npm install'
        sh 'npx playwright install --with-deps chromium'
      }
    }

    stage('E2E') {
      steps {
        // Playwright's webServer boots the app; no separate start step needed.
        sh 'npx playwright test'
      }
    }
  }

  post {
    always {
      // JUnit XML → readable via /job/<job>/<n>/testReport/api/json (merge gate reads this).
      junit testResults: 'test-results/junit.xml', allowEmptyResults: false
      archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
    }
  }
}
