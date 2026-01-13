pipeline {
    agent any

    tools {
        nodejs 'node-20' 
    }

    environment {
        NODE_ENV = 'production'
        DOCKER_HUB_USER = 'thienduong2909' 
        IMAGE_NAME = 'devops-blog-client'
        DOCKER_CRED = 'docker-hub-credentials'
    }

    stages {
        // 1. Luôn làm sạch workspace đầu tiên để tránh lỗi Git
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Cleaning up old modules...'
                sh 'rm -rf node_modules package-lock.json' 
                echo 'Installing dependencies...'
                sh 'npm install --include=dev' 
            }
        }

        // --- BƯỚC QUAN TRỌNG: TẠO ENV FILE TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ KHÁC ---
        stage('Create Env File') {
            steps {
                withCredentials([
                    string(credentialsId: 'API_URL_PROD', variable: 'NEXT_PUBLIC_API_URL'),
                    string(credentialsId: 'APP_URL_PROD', variable: 'NEXT_PUBLIC_APP_URL')
                ]) {
                    sh '''
                        echo "Creating .env.production file..."
                        # Tạo file .env để lát nữa Docker COPY vào trong image
                        echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.production
                        echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" >> .env.production
                        echo "NEXT_PUBLIC_APP_NAME=DevOps Blog" >> .env.production
                        
                        # Kiểm tra xem file có tồn tại không
                        ls -la .env.production
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
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

        // --- DOCKER BUILD: LÚC NÀY ĐÃ CÓ FILE ENV NÊN SẼ BUILD THÀNH CÔNG ---
        stage('Docker Build & Push') {
            steps {
                script {
                    echo '--- STARTING DOCKER BUILD ---'
                    withCredentials([usernamePassword(credentialsId: DOCKER_CRED, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        
                        // Login
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        
                        // Build Image (Docker sẽ copy .env.production vào trong ảnh)
                        sh "docker build -t $DOCKER_HUB_USER/$IMAGE_NAME:latest -t $DOCKER_HUB_USER/$IMAGE_NAME:$BUILD_NUMBER -f Dockerfile ."
                        
                        // Push Image
                        sh "docker push $DOCKER_HUB_USER/$IMAGE_NAME:latest"
                        sh "docker push $DOCKER_HUB_USER/$IMAGE_NAME:$BUILD_NUMBER"
                    }
                }
            }
        }
    }

    post {
        always {
            // Xóa file env sau khi chạy xong để bảo mật
            sh 'rm -f .env.production'
            sh "docker logout"
            // Xóa ảnh Docker trên máy Jenkins cho nhẹ máy
            sh "docker rmi $DOCKER_HUB_USER/$IMAGE_NAME:$BUILD_NUMBER || true"
        }
        success {
            echo 'Client build/deploy pipeline succeeded!'
        }
    }
}