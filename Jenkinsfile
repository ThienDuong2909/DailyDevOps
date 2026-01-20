pipeline {
    agent any

    tools {
        nodejs 'node-20' 
    }

    environment {
        // Application Environment
        NODE_ENV = 'production'
        
        // Docker Registry Configuration
        DOCKER_HUB_USER = 'thienduong2909' 
        IMAGE_NAME = 'devops-blog-client'
        DOCKER_CRED_ID = 'docker-hub-credentials'

        // GitOps / Infrastructure Repository Configuration
        // Note: Do not include 'https://' here as it is constructed dynamically below
        K8S_MANIFEST_REPO = 'github.com/ThienDuong2909/Blog_K8S.git'
        GIT_CRED_ID = 'github-access-token' 
        GIT_EMAIL = 'jenkins-bot@thienduong.info'
        GIT_NAME = 'Jenkins Bot'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                echo 'Cleaning up workspace to ensure a fresh start...'
                cleanWs()
            }
        }

        stage('Checkout Source Code') {
            steps {
                echo 'Checking out application source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Removing old modules and installing fresh dependencies...'
                sh 'rm -rf node_modules package-lock.json' 
                sh 'npm install --include=dev' 
            }
        }

        stage('Inject Environment Secrets') {
            steps {
                echo 'Injecting secrets into production environment file...'
                withCredentials([
                    string(credentialsId: 'API_URL_PROD', variable: 'NEXT_PUBLIC_API_URL'),
                    string(credentialsId: 'APP_URL_PROD', variable: 'NEXT_PUBLIC_APP_URL')
                ]) {
                    sh '''
                        echo "Creating .env.production file..."
                        echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.production
                        echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" >> .env.production
                        echo "NEXT_PUBLIC_APP_NAME=DevOps Blog" >> .env.production
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Starting static code analysis...'
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sonar-server') {
                        sh """
                            "${scannerHome}/bin/sonar-scanner" \
                            -Dsonar.projectKey=devops-blog-client \
                            -Dsonar.projectName='DevOps Blog Client' \
                            -Dsonar.sources=. \
                            -Dsonar.exclusions=node_modules/**,.next/**,coverage/**,**/*.d.ts \
                            -Dsonar.sourceEncoding=UTF-8
                        """
                    }
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    echo "Building Docker image with tag: ${BUILD_NUMBER}..."
                    withCredentials([usernamePassword(credentialsId: DOCKER_CRED_ID, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        
                        // Login to Docker Hub
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        
                        // Build Image
                        // Note: The .env.production file created earlier is copied into the image here
                        sh "docker build -t $DOCKER_HUB_USER/$IMAGE_NAME:$BUILD_NUMBER -f Dockerfile ."
                        
                        // Push Image to Registry
                        sh "docker push $DOCKER_HUB_USER/$IMAGE_NAME:$BUILD_NUMBER"
                    }
                }
            }
        }

        stage('Update K8s Manifest') {
            steps {
                script {
                    echo 'Updating Kubernetes manifest repository with new image version...'
                    withCredentials([usernamePassword(credentialsId: GIT_CRED_ID, passwordVariable: 'GIT_TOKEN', usernameVariable: 'GIT_USER')]) {
                        
                        // 1. Clone the Infrastructure/GitOps Repository
                        // Using specific credentials to allow write access
                        sh "git clone https://${GIT_USER}:${GIT_TOKEN}@${K8S_MANIFEST_REPO} k8s-repo"
                        
                        // 2. Navigate to repo and configure Git Identity
                        dir("k8s-repo") {
                            sh "git config user.email '${GIT_EMAIL}'"
                            sh "git config user.name '${GIT_NAME}'"
                            
                            // Ensure we are on the correct branch
                            sh "git checkout main"
                            
                            // 3. Update the image version using SED
                            // This replaces "image: user/repo:any_tag" with "image: user/repo:current_build_number"
                            sh """
                                sed -i 's|image: ${DOCKER_HUB_USER}/${IMAGE_NAME}:.*|image: ${DOCKER_HUB_USER}/${IMAGE_NAME}:${BUILD_NUMBER}|' deployment.yml
                            """
                            
                            // 4. Verify changes
                            echo "Verifying changes in deployment.yml:"
                            sh "grep 'image:' deployment.yml"
                            
                            // 5. Commit and Push changes
                            try {
                                sh "git add deployment.yml"
                                // Check if there are changes to commit to avoid exit code 1
                                sh "git diff-index --quiet HEAD || git commit -m 'chore(ci): update image version to ${BUILD_NUMBER}'"
                                sh "git push origin main"
                                echo "Manifest repository updated successfully."
                            } catch (Exception e) {
                                echo "Failed to push changes or no changes detected: ${e}"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Performing post-build cleanup...'
            // Remove sensitive environment file
            sh 'rm -f .env.production'
            // Logout from Docker to prevent credential leakage
            sh "docker logout"
            // Cleanup the cloned Manifest repository
            sh "rm -rf k8s-repo" 
        }
        success {
            echo "Pipeline executed successfully. Build ${BUILD_NUMBER} deployed."
        }
        failure {
            echo "Pipeline failed. Please check logs for details."
        }
    }
}