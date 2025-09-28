from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import requests
import os
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this in production

# Backend API URL
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        
        # Create user via API
        response = requests.post(f'{BACKEND_URL}/users', json={
            'name': name,
            'email': email
        })
        
        if response.status_code == 200:
            user_data = response.json()
            session['user_id'] = user_data['id']
            session['user_name'] = user_data['name']
            return redirect(url_for('test'))
        else:
            return render_template('register.html', error='Failed to create user')
    
    return render_template('register.html')

@app.route('/test')
def test():
    if 'user_id' not in session:
        return redirect(url_for('register'))
    
    # Get questions from API
    response = requests.get(f'{BACKEND_URL}/questions')
    questions = response.json() if response.status_code == 200 else []
    
    return render_template('test.html', questions=questions)

@app.route('/submit-test', methods=['POST'])
def submit_test():
    if 'user_id' not in session:
        return redirect(url_for('register'))
    
    # Prepare answers
    answers = []
    for key, value in request.form.items():
        if key.startswith('question_'):
            question_id = int(key.replace('question_', ''))
            answer = int(value)
            answers.append({'question_id': question_id, 'answer': answer})
    
    # Submit test via API
    response = requests.post(f'{BACKEND_URL}/submit-test', json={
        'user_id': session['user_id'],
        'answers': answers
    })
    
    if response.status_code == 200:
        result = response.json()
        session['personality_type'] = result['personality_type']
        return redirect(url_for('results'))
    else:
        return render_template('test.html', error='Failed to submit test')

@app.route('/results')
def results():
    if 'user_id' not in session or 'personality_type' not in session:
        return redirect(url_for('register'))
    
    personality_type = session['personality_type']
    
    # Personality type descriptions
    descriptions = {
        'INTJ': 'The Architect - Strategic and independent thinkers',
        'INTP': 'The Thinker - Innovative and logical problem-solvers',
        'ENTJ': 'The Commander - Bold and strong-willed leaders',
        'ENTP': 'The Debater - Smart and curious thinkers',
        'INFJ': 'The Advocate - Creative and insightful inspirers',
        'INFP': 'The Mediator - Poetic and kind-hearted idealists',
        'ENFJ': 'The Protagonist - Charismatic and inspiring leaders',
        'ENFP': 'The Campaigner - Enthusiastic and creative free spirits',
        'ISTJ': 'The Logistician - Practical and fact-minded individuals',
        'ISFJ': 'The Protector - Warm-hearted and dedicated protectors',
        'ESTJ': 'The Executive - Excellent administrators and managers',
        'ESFJ': 'The Consul - Extraordinarily caring and social people',
        'ISTP': 'The Virtuoso - Bold and practical experimenters',
        'ISFP': 'The Adventurer - Flexible and charming artists',
        'ESTP': 'The Entrepreneur - Smart, energetic and perceptive people',
        'ESFP': 'The Entertainer - Spontaneous, energetic and enthusiastic people'
    }
    
    description = descriptions.get(personality_type, 'Unknown personality type')
    
    return render_template('results.html', 
                         personality_type=personality_type, 
                         description=description)

@app.route('/chat')
def chat():
    if 'user_id' not in session:
        return redirect(url_for('register'))
    
    # Get chat history
    response = requests.get(f'{BACKEND_URL}/chat/{session["user_id"]}')
    messages = response.json() if response.status_code == 200 else []
    
    return render_template('chat.html', messages=messages)

@app.route('/send-message', methods=['POST'])
def send_message():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    message = request.json.get('message', '')
    
    # Send message via API
    response = requests.post(f'{BACKEND_URL}/chat', json={
        'user_id': session['user_id'],
        'message': message
    })
    
    if response.status_code == 200:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to send message'}), 500

@app.route('/api/chat-history')
def get_chat_history():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    response = requests.get(f'{BACKEND_URL}/chat/{session["user_id"]}')
    messages = response.json() if response.status_code == 200 else []
    
    return jsonify(messages)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)