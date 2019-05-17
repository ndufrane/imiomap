#!/usr/bin/env groovy
@Library('jenkins-pipeline-scripts') _

pipeline {
    agent any
    triggers {
        pollSCM('*/3 * * * *')
    }
    options {
        buildDiscarder(logRotator(numToKeepStr:'50'))
    }
    stages {
        stage('Build') {
            agent any
            steps {
                sh 'git submodule update --init --recursive'
                sh 'docker-compose build --no-cache'
            }
        }
        stage('Push image to registry') {
            agent any
            steps {
                pushImageToRegistry (
                    env.BUILD_ID,
                    "iaurban/imiomap"
                )
            }
        }
    }
}
