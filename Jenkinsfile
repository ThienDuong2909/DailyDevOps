pipeline {
    agent any

    tools {
        nodejs 'node-20' 
    }

    environment {
        NODE_ENV = 'production'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Kiem tra file trong thu muc hien tai:'
                sh 'ls -la' // In ra danh sách file để debug xem có package-lock.json không
                
                echo 'Dang cai dat thu vien...'
                // Đổi tạm từ npm ci sang npm install để fix lỗi thiếu lockfile
                sh 'npm install' 
            }
        }

        // --- PLACEHOLDERS FOR FUTURE INTEGRATIONS ---

        stage('SonarQube Analysis') {
            steps {
                echo 'Skipping SonarQube Analysis (TODO: Integrate SonarQube)'
            }
        }

        stage('Sonatype Nexus') {
            steps {
                echo 'Skipping Artifact Upload to Sonatype Nexus (TODO: Integrate Nexus)'
            }
        }

        stage('Docker Build & Push') {
            steps {
                echo 'Skipping Docker Build & Push (TODO: Create Dockerfile & Integrate Registry)'
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
