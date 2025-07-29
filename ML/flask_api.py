from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import io
from ocr_app import extract_text_and_numbers
import re

app = Flask(__name__)
CORS(app, resources={r"/extract-id-number": {"origins": "http://localhost:3000"}})

@app.route('/extract-id-number', methods=['POST'])
def extract_id_number():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Open and process the image
        image = Image.open(file.stream).convert('RGB')
        image_np = np.array(image)
        number_results, _ = extract_text_and_numbers(image_np)
        print('Extracted numbers:', number_results)  # Debug

        # Flatten number_results if it's a dictionary
        flat_numbers = []
        if isinstance(number_results, dict):
            for key, values in number_results.items():
                flat_numbers.extend(values)
        else:
            flat_numbers = number_results

        # Clean numbers (remove spaces for Aadhar)
        cleaned_numbers = []
        for num in flat_numbers:
            # Remove spaces and other non-alphanumeric characters
            cleaned = re.sub(r'\s+', '', num)
            if cleaned.isdigit() and len(cleaned) == 12:
                cleaned_numbers.append(cleaned)  # Valid Aadhar
            else:
                cleaned_numbers.append(num)  # Keep original for other formats

        # Construct response
        response = {
            'Aadhar': [num for num in cleaned_numbers if len(num) == 12 and num.isdigit()],
            'PAN': [num for num in cleaned_numbers if len(num) == 10 and num.isalnum()],
            'General Numbers': cleaned_numbers  # All numbers, cleaned
        }
        print('Response:', response)  # Debug
        return jsonify(response), 200
    except Exception as e:
        print('Error processing image:', str(e))  # Debug
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)