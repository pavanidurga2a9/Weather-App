pipeline {
    agent any

    environment {
        // Point to the system Python executable on this laptop
        SYS_PYTHON = 'C:\\Users\\ks299\\AppData\\Local\\Programs\\Python\\Python312\\python.exe'
    }

    stages {
        stage('Create Venv & Install Dependencies') {
            steps {
                bat '''
                echo "Creating local virtual environment inside Jenkins workspace..."
                "%SYS_PYTHON%" -m venv venv
                
                echo "Upgrading pip and installing requirements..."
                venv\\Scripts\\python -m pip install --upgrade pip
                venv\\Scripts\\python -m pip install -r backend/requirements.txt
                '''
            }
        }

        stage('Django Check') {
            steps {
                bat '''
                echo "Running Django checks..."
                cd backend
                ..\\venv\\Scripts\\python manage.py check
                '''
            }
        }
    }

    post {
        success {
            echo 'Build and Verification Successful!'
        }
        failure {
            echo 'Build Failed. Please check console output logs.'
        }
    }
}
