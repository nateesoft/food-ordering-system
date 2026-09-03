pipeline {
    agent any

    environment {
        DEPLOY_ROOT = 'D:\\ICS-Projects\\apps\\food-ordering'
        DEPLOY_DIR  = 'D:\\ICS-Projects\\apps\\food-ordering\\food-ordering-system'
        PM2_HOME    = 'C:\\Users\\Administrator\\.pm2'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Load Env') {
            steps {
                // The production .env is placed manually on the server and lives at
                // %DEPLOY_DIR%\.env . The pipeline never creates or overwrites it.
                // It must be loaded into the workspace BEFORE Build because `next build`
                // inlines NEXT_PUBLIC_* vars into the bundle.
                bat '''
                    if not exist "%DEPLOY_DIR%\\.env" (
                        echo ERROR: "%DEPLOY_DIR%\\.env" not found.
                        echo Create the folder and place the production .env file there manually, then re-run.
                        exit /b 1
                    )
                    copy /Y "%DEPLOY_DIR%\\.env" .env
                '''
            }
        }

        stage('Build') {
            steps {
                bat 'npm ci'
                bat 'npm run build'
            }
        }

        stage('Prepare Standalone') {
            steps {
                bat 'if exist public (xcopy /E /I /Y public .next\\standalone\\public\\) else (echo No public folder, skipping)'
                bat 'if exist .next\\static (xcopy /E /I /Y .next\\static .next\\standalone\\.next\\static\\) else (echo No .next\\static folder, skipping)'
            }
        }

        stage('Stop PM2') {
            steps {
                bat 'pm2 stop food-ordering-system 2>nul & exit 0'
                bat 'pm2 delete food-ordering-system 2>nul & exit 0'
            }
        }

        stage('Deploy') {
            steps {
                bat "if not exist %DEPLOY_DIR% mkdir %DEPLOY_DIR%"
                bat '''
                    powershell -Command "Copy-Item -Path .next\\standalone\\* -Destination %DEPLOY_DIR% -Recurse -Force"
                '''
            }
        }

        stage('Deploy Config') {
            steps {
                bat "copy /Y ecosystem.config.js %DEPLOY_DIR%\\ecosystem.config.js"
                // Note: %DEPLOY_DIR%\.env is managed manually and is left untouched here.
                // The standalone server.js reads it from its cwd at runtime.
            }
        }

        stage('Start PM2') {
            steps {
                bat "if not exist %DEPLOY_DIR%\\logs mkdir %DEPLOY_DIR%\\logs"
                bat "cd /d %DEPLOY_DIR% && pm2 start ecosystem.config.js --only food-ordering-system --env production"
                bat 'pm2 save'
            }
        }

        stage('Register Startup') {
            steps {
                bat 'pm2-startup install 2>nul & exit 0'
                bat 'pm2 save'
            }
        }
    }

    post {
        success {
            bat 'pm2 list'
            echo 'Deployment food-ordering-system successful!'
        }
        failure {
            echo 'Deployment food-ordering-system failed — check the logs above.'
        }
    }
}
