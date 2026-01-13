pipeline {
    agent any

    tools {
        nodejs 'node-20' 
    }

    environment {
        NODE_ENV = 'production'
        DOCKER_HUB_USER = 'thienduong2909' 
        IMAGE_NAME = 'devops-blog-client' // Đặt tên image cho client
        DOCKER_CRED = 'docker-hub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Cleaning up old modules...'
                sh 'rm -rf node_modules'
                sh 'rm -f package-lock.json' 
                echo 'Dang cai dat TAT CA thu vien (BAT BUOC them --include=dev)...'
                sh 'npm install --include=dev' 
                sh 'npm list tailwindcss || true' 
            }
        }

        // --- PLACEHOLDERS FOR FUTURE INTEGRATIONS ---

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    // Ensure path uses forward slashes for compatibility with sh on Windows
                    def scannerHomePath = scannerHome.replace('\\', '/')
                    
                    withSonarQubeEnv('sonar-server') {
                        sh """
                            "${scannerHomePath}/bin/sonar-scanner" \
                            -Dsonar.projectKey=devops-blog-client \
                            -Dsonar.projectName='DevOps Blog Client' \
                            -Dsonar.sources=. \
                            -Dsonar.typescript.tsconfigPath=tsconfig.json \
                            -Dsonar.exclusions=node_modules/**,.next/**,coverage/**,**/*.d.ts \
                            -Dsonar.sourceEncoding=UTF-8
                        """
                    }
                }
            }
        }

        stage('Sonatype Nexus') {
            steps {
                echo 'Skipping Artifact Upload to Sonatype Nexus (TODO: Integrate Nexus)'
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    echo '--- STARTING DOCKER BUILD ---'
                    withCredentials([usernamePassword(credentialsId: DOCKER_CRED, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        
                        // 1. Đăng nhập Docker Hub
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        
                        // 2. Build Image
                        // Lưu ý: Dấu chấm (.) cuối cùng là bắt buộc
                        sh "docker build -t $DOCKER_HUB_USER/$IMAGE_NAME:latest -t $DOCKER_HUB_USER/$IMAGE_NAME:$BUILD_NUMBER -f Dockerfile ."
                        
                        // 3. Push Image lên Hub
                        sh "docker push $DOCKER_HUB_USER/$IMAGE_NAME:latest"
                        sh "docker push $DOCKER_HUB_USER/$IMAGE_NAME:$BUILD_NUMBER"
                    }
                }
            }
        }
        
        stage('Update CD Repo') {
            steps {
                echo 'Skipping CD Repo Update (TODO: Commit to GitOps repo)'
            }
        }

        // --------------------------------------------

        stage('Build') {
            // Next.js requires environment variables at BUILD time
            environment {
                NEXT_PUBLIC_APP_NAME = "DevOps Blog"
            }
            steps {
                withCredentials([
                    string(credentialsId: 'API_URL_PROD', variable: 'NEXT_PUBLIC_API_URL'),
                    string(credentialsId: 'APP_URL_PROD', variable: 'NEXT_PUBLIC_APP_URL')
                ]) {
                    sh '''
                        echo "Building Next.js application..."
                        echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.production
                        echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" >> .env.production
                        echo "NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}" >> .env.production
                        
                        npm run build
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'rm -f .env.production'
        }
        success {
            echo 'Client build/deploy pipeline succeeded!'
        }
    }
}
