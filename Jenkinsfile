pipeline {
    agent any

    stages {
        stage('Install Dependencies') {
            steps {
                bat '''
                cd backend
                python -m pip install --upgrade pip
                python -m pip install -r requirements.txt
                '''
            }
        }

        stage('Django Check') {
            steps {
                bat '''
                cd backend
                python manage.py check
                '''
            }
        }
    }

    post {
        success {
            echo 'Build and Verification Successful!'
        }
        failure {
            echo 'Build Failed. Please check logs.'
        }
    }
}
