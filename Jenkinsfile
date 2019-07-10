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
        stage('Deploy to prod ?') {
            agent none
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    input (
                        message: 'Should we deploy to prod ?'
                    )
                }
            }
            post {
                aborted {
                    echo 'In post aborted'
                }
                success {
                    echo 'In post success'
                }
            }
        }
        stage('Deploying to prod') {
            agent any
            steps {
                sh 'docker pull docker-staging.imio.be/iaurban/imiomap:latest'
                sh 'docker tag docker-staging.imio.be/iaurban/imiomap:latest docker-prod.imio.be/iaurban/imiomap:latest'
                sh 'docker push docker-prod.imio.be/iaurban/imiomap:latest'
            }
        }
    }
}
