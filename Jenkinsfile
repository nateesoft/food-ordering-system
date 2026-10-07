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
                // robocopy instead of Copy-Item so stale chunks/packages from older builds are purged.
                // Root: top-level files only (server.js, package.json), never .env* — that file is
                // managed manually on the server. Subfolders are mirrored with /PURGE.
                // robocopy exit codes 0-7 = success, >=8 = failure; check after each call.
                bat '''
                    robocopy .next\\standalone "%DEPLOY_DIR%" /XF .env* /NFL /NDL /NJH /NP
                    if %ERRORLEVEL% GEQ 8 exit /b 1
                    robocopy .next\\standalone\\.next "%DEPLOY_DIR%\\.next" /E /PURGE /NFL /NDL /NJH /NP
                    if %ERRORLEVEL% GEQ 8 exit /b 1
                    robocopy .next\\standalone\\node_modules "%DEPLOY_DIR%\\node_modules" /E /PURGE /NFL /NDL /NJH /NP
                    if %ERRORLEVEL% GEQ 8 exit /b 1
                    if exist .next\\standalone\\public (
                        robocopy .next\\standalone\\public "%DEPLOY_DIR%\\public" /E /PURGE /NFL /NDL /NJH /NP
                    )
                    if %ERRORLEVEL% GEQ 8 exit /b 1
                    exit /b 0
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
            // If the app is no longer registered in PM2 (it was deleted in 'Stop PM2'), try to
            // bring whatever is in DEPLOY_DIR back up. If it is still registered (failure happened
            // before 'Stop PM2'), leave it alone — `pm2 start` would restart it needlessly.
            bat '''
                call pm2 describe food-ordering-system >nul 2>&1
                if errorlevel 1 if exist "%DEPLOY_DIR%\\ecosystem.config.js" if exist "%DEPLOY_DIR%\\server.js" (
                    if not exist "%DEPLOY_DIR%\\logs" mkdir "%DEPLOY_DIR%\\logs"
                    cd /d "%DEPLOY_DIR%" && call pm2 start ecosystem.config.js --only food-ordering-system --env production
                )
                exit /b 0
            '''
        }
    }
}
