pipeline {
    agent any

    tools {
        nodejs 'node-20' 
    }

    options {
        // Auto-abort if pipeline runs longer than 30 minutes
        timeout(time: 30, unit: 'MINUTES')
        // Keep only last 5 builds to save disk space
        buildDiscarder(logRotator(numToKeepStr: '5'))
        // Prevent concurrent builds on the same branch
        disableConcurrentBuilds()
        // Add timestamps to console output for easier debugging
        timestamps()
    }

    environment {
        // Docker Registry Configuration
        DOCKER_HUB_USER = 'thienduong2909' 
        IMAGE_NAME = 'devops-blog-client'
        IMAGE_TAG = "${DOCKER_HUB_USER}/${IMAGE_NAME}"
        DOCKER_CRED_ID = 'docker-hub-credentials'

        // GitOps / Infrastructure Repository Configuration
        K8S_MANIFEST_REPO = 'github.com/ThienDuong2909/Blog_K8S.git'
        GIT_CRED_ID = 'github-access-token' 
        GIT_EMAIL = 'jenkins-bot@thienduong.info'
        GIT_NAME = 'Jenkins Bot'

        // npm cache directory - persists across builds for faster installs
        NPM_CACHE_DIR = "${WORKSPACE}/.npm-cache"

        // Per-workspace Docker config — tránh race condition khi 2 pipeline chạy song song
        // trên cùng 1 agent (mỗi pipeline có ~/.docker riêng, không ghi đè nhau)
        DOCKER_CONFIG = "${WORKSPACE}/.docker"
        BUILD_CONTEXT = '.'
        RUN_E2E = "${env.RUN_E2E ?: 'false'}"
        PLAYWRIGHT_BASE_URL = 'http://localhost:3000'
        PLAYWRIGHT_API_URL = 'http://localhost:3001'
        NEXT_PUBLIC_APP_ENV_DEFAULT = 'production'
        NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_DEFAULT = "${env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?: '0'}"
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                echo 'Checking out application source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies from lockfile...'
                // npm ci: designed for CI environments
                // - Automatically removes existing node_modules (no manual rm needed)
                // - Installs exact versions from package-lock.json (deterministic)
                // - 2-3x faster than npm install
                // - Fails if package-lock.json is out of sync with package.json
                sh '''
                    mkdir -p "${NPM_CACHE_DIR}" "${DOCKER_CONFIG}"
                    npm ci --cache "${NPM_CACHE_DIR}" --prefer-offline --no-audit
                '''
            }
        }

        stage('Lint') {
            steps {
                echo 'Running lint checks...'
                sh 'npm run lint'
            }
        }

        stage('Inject Environment Secrets') {
            steps {
                echo 'Injecting secrets into production environment file...'
                withCredentials([
                    string(credentialsId: 'API_URL_PROD', variable: 'NEXT_PUBLIC_API_URL'),
                    string(credentialsId: 'APP_URL_PROD', variable: 'NEXT_PUBLIC_APP_URL'),
                    string(credentialsId: 'NEXT_PUBLIC_SENTRY_DSN', variable: 'NEXT_PUBLIC_SENTRY_DSN'),
                    string(credentialsId: 'NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE', variable: 'NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE')
                ]) {
                    sh '''
                        cat > .env.production << EOF
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
NEXT_PUBLIC_APP_NAME=DevOps Blog
NEXT_PUBLIC_SITE_URL=https://blog.thienduong.info
INTERNAL_API_URL=http://devops-blog-server-svc
NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV:-${NEXT_PUBLIC_APP_ENV_DEFAULT}}
NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=${NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE:-${NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_DEFAULT}}
EOF
                    '''
                    // Verify the env file was created correctly (masked values)
                    sh 'echo "Environment file created with $(wc -l < .env.production) variables"'
                }
            }
        }

        stage('Build Application') {
            steps {
                echo 'Running production build before containerization...'
                sh 'npm run build'
            }
        }

        stage('Run E2E Smoke Tests') {
            when {
                expression { env.RUN_E2E == 'true' }
            }
            steps {
                echo 'Installing Playwright browser and running E2E smoke suite...'
                sh 'npm run test:e2e:install'
                sh 'npm run test:e2e'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Starting static code analysis...'
                script {
                    def scannerHome = tool 'sonar-scanner'
                    
                    withSonarQubeEnv('sonar-server') {
                        sh """
                            "${scannerHome}/bin/sonar-scanner" \\
                            -Dsonar.projectKey=devops-blog-client \\
                            -Dsonar.projectName='DevOps Blog Client' \\
                            -Dsonar.sources=. \\
                            -Dsonar.exclusions=node_modules/**,.next/**,.npm-cache/**,coverage/**,playwright-report/**,test-results/**,tests/**,**/*.d.ts \\
                            -Dsonar.coverage.exclusions=app/**,components/**,hooks/**,lib/**,stores/**,types/**,next.config.js,tailwind.config.js,postcss.config.js \\
                            -Dsonar.sourceEncoding=UTF-8
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                echo 'Waiting for SonarQube Quality Gate result...'
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error "Pipeline aborted due to Quality Gate failure: ${qg.status}"
                        }
                    }
                    echo 'Quality Gate passed successfully.'
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    echo "Building Docker image: ${IMAGE_TAG}:${BUILD_NUMBER}..."
                    withCredentials([usernamePassword(credentialsId: DOCKER_CRED_ID, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        
                        // Build with specific version tag, then re-tag as latest
                        sh "docker build --pull -t ${IMAGE_TAG}:${BUILD_NUMBER} -f Dockerfile ${BUILD_CONTEXT}"
                        sh "docker tag ${IMAGE_TAG}:${BUILD_NUMBER} ${IMAGE_TAG}:latest"

                        echo 'Running container startup smoke check...'
                        sh """
                            docker run -d --name client-smoke-${BUILD_NUMBER} -p 3000:3000 ${IMAGE_TAG}:${BUILD_NUMBER}
                            sleep 15
                            curl --fail http://127.0.0.1:3000 || (docker logs client-smoke-${BUILD_NUMBER} && exit 1)
                            docker rm -f client-smoke-${BUILD_NUMBER}
                        """
                        
                        // Push versioned tag
                        sh "docker push ${IMAGE_TAG}:${BUILD_NUMBER}"
                        
                        // Re-authenticate before pushing latest to prevent token expiry
                        // (long push operations with retries can cause session timeout)
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        sh "docker push ${IMAGE_TAG}:latest"
                    }
                }
            }
        }

        stage('Update K8s Manifest') {
            steps {
                script {
                    echo 'Updating Kubernetes manifest repository with new image version...'
                    
                    // Use Jenkins checkout step to clone — credentials are managed internally
                    // and NEVER exposed in console output (unlike raw git clone)
                    dir('k8s-repo') {
                        checkout([
                            $class: 'GitSCM',
                            branches: [[name: 'main']],
                            extensions: [[$class: 'CloneOption', depth: 1, shallow: true]],
                            userRemoteConfigs: [[
                                url: "https://${K8S_MANIFEST_REPO}",
                                credentialsId: GIT_CRED_ID
                            ]]
                        ])
                    }

                    // Use withCredentials only for push — with shell-level interpolation
                    withCredentials([usernamePassword(credentialsId: GIT_CRED_ID, passwordVariable: 'GIT_TOKEN', usernameVariable: 'GIT_USER')]) {
                        dir('k8s-repo') {
                            sh "git config user.email '${GIT_EMAIL}'"
                            sh "git config user.name '${GIT_NAME}'"
                            
                            sh """
                                sed -i 's|image: ${IMAGE_TAG}:.*|image: ${IMAGE_TAG}:${BUILD_NUMBER}|' deployment.yaml
                            """
                            
                            echo "Verifying changes in deployment.yaml:"
                            sh "grep 'image:' deployment.yaml"
                            
                            // Check if there are actual changes before committing
                            sh "git add deployment.yaml"
                            def hasChanges = sh(script: 'git diff-index --quiet HEAD', returnStatus: true) != 0
                            
                            if (hasChanges) {
                                sh "git commit -m 'chore(ci): update client image to ${BUILD_NUMBER}'"
                                // Set remote URL with credentials for push (shell interpolation — Jenkins will mask the token)
                                sh 'git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@' + "${K8S_MANIFEST_REPO}"
                                // Fetch + rebase to handle remote having newer commits
                                // (e.g. server pipeline pushed while this build was running)
                                sh "git fetch origin main"
                                sh "git rebase origin/main"
                                // Use HEAD:main because Jenkins GitSCM checkout leaves repo in detached HEAD state
                                sh "git push origin HEAD:main"
                                echo "Manifest repository updated successfully."
                            } else {
                                echo "No changes detected in deployment.yaml — skipping commit."
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
            sh 'rm -f .env.production'
            sh "docker rm -f client-smoke-${BUILD_NUMBER} || true"
            sh "docker logout || true"
            sh "rm -rf k8s-repo"
            // Remove Docker images from agent to free disk space
            sh "docker rmi ${IMAGE_TAG}:${BUILD_NUMBER} ${IMAGE_TAG}:latest || true"
        }
        success {
            echo "Pipeline executed successfully. Image: ${IMAGE_TAG}:${BUILD_NUMBER}"
        }
        failure {
            echo "Pipeline failed at stage: ${env.STAGE_NAME}. Check logs for details."
        }
        cleanup {
            // Clean workspace AFTER everything else - at the END instead of the START
            // This allows npm cache to persist for the NEXT build
            // cleanWs moves here so .npm-cache benefits next run
            cleanWs(deleteDirs: true, patterns: [
                // Keep npm cache between builds for faster installs
                [pattern: '.npm-cache/**', type: 'EXCLUDE']
            ])
        }
    }
}
