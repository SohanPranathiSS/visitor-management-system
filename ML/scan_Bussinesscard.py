from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import io
import easyocr
import re
import cv2
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
# CORS configuration for both endpoints
CORS(app, resources={r"/extract-id-number": {"origins": "http://localhost:3000"}, r"/upload": {"origins": "http://localhost:3000"}})

# Configuration for file uploads
app.config['UPLOAD_FOLDER'] = 'static/uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

# Initialize OCR Reader (one-time setup for efficiency)
reader = easyocr.Reader(['en'], gpu=False)

def allowed_file(filename):
    """Checks if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_and_rotate(image):
    """Preprocesses the image for better OCR results, including rotation."""
    img = np.array(image.convert("RGB"))
    
    # Rotate image if it's taller than it is wide
    h, w, _ = img.shape
    if h > w:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        
    # Convert to grayscale and apply sharpening
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    sharpen_kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharp = cv2.filter2D(gray, -1, sharpen_kernel)
    
    # Apply thresholding
    _, thresh = cv2.threshold(sharp, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return thresh, img

def extract_text_and_numbers(image_np):
    """Extracts text and numbers from an image using EasyOCR."""
    results = reader.readtext(image_np, detail=0, paragraph=False)
    full_text = ' '.join(results)
    
    # Extract Aadhar (12 digits, with optional spaces) and PAN (10 alphanumeric characters)
    aadhar_pattern = r'\b(?:\d{4}\s?\d{4}\s?\d{4}|\d{12})\b'
    pan_pattern = r'\b[A-Z]{5}\d{4}[A-Z]\b'
    numbers = re.findall(f'{aadhar_pattern}|{pan_pattern}', full_text)
    return numbers, results

def extract_email(text):
    """Extracts email addresses using regex."""
    match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    return match.group(0) if match else None

def extract_mobile_number(text):
    """Extracts a 10-digit mobile number, optionally with a +91 prefix."""
    mobile_patterns = [
        r'\+91[-\s]?([6-9]\d{9})\b',  # +91 followed by mobile number
        r'\b([6-9]\d{9})\b'  # Direct mobile number starting with 6,7,8,9
    ]
    
    for pattern in mobile_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            full_match = re.search(r'\+91[-\s]?' + re.escape(match) + r'(?!\s*(?:ext|extension|x))', text, re.IGNORECASE)
            if full_match:
                return full_match.group(0).strip()
    
    return None

def extract_company_number(text):
    """Extracts a company landline number, potentially with an extension."""
    patterns = [
        r'(\+91[-\s]*(?:0?[1-5]\d|40|80|11|22|33|44)[-\s]*\d{6,8})(\s*(?:ext|extension|x)[-:\s]*\d+)?',
        r'(\+91[-\s]*0\d{2,4}[-\s]*\d{6,8})(\s*(?:ext|extension|x)[-:\s]*\d+)?',
        r'(?:tel|phone|ph)[-:\s]*(\+91[-\s]*\d{2,4}[-\s]*\d{6,8})(\s*(?:ext|extension|x)[-:\s]*\d+)?',
        r'(?:office|off)[-:\s]*(\+91[-\s]*\d{2,4}[-\s]*\d{6,8})(\s*(?:ext|extension|x)[-:\s]*\d+)?'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            number = match.group(1).strip()
            extension = match.group(2).strip() if match.group(2) else None
            clean_number = re.sub(r'[^\d]', '', number)
            if len(clean_number) == 10 and clean_number[0] in '6789':
                continue
            result = number
            if extension:
                result += f" {extension}"
            return result.strip()
    
    return None

def extract_website(text):
    """Extracts a website URL."""
    match = re.search(r'\b(?:www\.|https?://)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?\b', text)
    if match and any(tld in match.group(0) for tld in ['.com', '.in', '.org', '.net']):
        return match.group(0)
    return None

def extract_company_name(lines):
    """Extracts company name based on keywords."""
    for line in lines:
        if any(keyword in line.lower() for keyword in ['services', 'solutions', 'pvt', 'ltd', 'limited', 'software']):
            return line.strip().title()
    return "Not Found"

def extract_address(lines):
    """Extracts address by identifying address-related keywords."""
    address_parts = []
    address_keywords = ['block', 'house', 'road', 'street', 'nagar', 'gumpet', 'hyderabad', 'ts', 'india', r'\b\d{5,6}\b', 'begumpet', 'white']
    non_address_keywords = ['@', 'www', '.com', 'phone', 'mobile', 'email', 'services', 'solutions', 'pvt', 'ltd', r'\+91', 'director', 'manager', 'strategy', 'delivery']
    name_patterns = [r'\b(?:shatru|naik|director|manager)\b']

    # Apply OCR corrections to all lines upfront
    cleaned_lines = []
    for line in lines:
        cleaned_line = line.strip()
        # Apply OCR corrections for common errors (case-insensitive)
        cleaned_line = re.sub(r'[Ii][Ii][lI](?=\s|,|$)', 'III', cleaned_line, flags=re.IGNORECASE)
        cleaned_line = re.sub(r'lil(?=\s|,|$)', 'III', cleaned_line, flags=re.IGNORECASE)
        cleaned_line = re.sub(r'lii(?=\s|,|$)', 'III', cleaned_line, flags=re.IGNORECASE)
        cleaned_line = cleaned_line.replace(';', ',')  # Replace semicolons with commas
        if cleaned_line:
            cleaned_lines.append(cleaned_line)
    
    # Find the starting point of the address
    start_index = -1
    for i, line in enumerate(cleaned_lines):
        line_lower = line.lower()
        if any(re.search(keyword, line_lower) for keyword in address_keywords):
            if not any(re.search(keyword, line_lower) for keyword in non_address_keywords):
                start_index = i
                break
    
    if start_index != -1:
        for i in range(start_index, len(cleaned_lines)):
            line = cleaned_lines[i].strip()
            if not line:
                continue
            line_lower = line.lower()
            
            # Stop if we hit clear non-address content
            if any(re.search(keyword, line_lower) for keyword in non_address_keywords):
                break
            
            # Skip lines that contain person names
            if any(re.search(pattern, line_lower) for pattern in name_patterns):
                continue
                
            # Stop if we hit a person's name (but not if it contains address keywords)
            if (line.count(' ') <= 2 and 
                re.match(r'^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$', line) and 
                not any(re.search(keyword, line_lower) for keyword in address_keywords)):
                break
            
            # Add the line to address if it looks like address content
            if (any(re.search(keyword, line_lower) for keyword in address_keywords) or 
                len(address_parts) > 0):
                # Skip single digits unless they're part of a larger address component
                if len(line) <= 2 and line.isdigit() and not any(keyword in line_lower for keyword in address_keywords):
                    continue
                address_parts.append(line)
                
            # Stop after collecting a reasonable number of address lines
            if len(address_parts) >= 3 and any(keyword in line_lower for keyword in ['india', r'\b\d{5,6}\b']):
                break
    
    # Look for pincode separately if not found in address
    pincode = None
    for line in cleaned_lines:
        pincode_match = re.search(r'\b(\d{6})\b', line)
        if pincode_match:
            pincode = pincode_match.group(1)
            break
    
    # If pincode found and not already in address, add it
    if pincode and not any(pincode in part for part in address_parts):
        if address_parts and 'india' in address_parts[-1].lower():
            address_parts[-1] = address_parts[-1] + f" - {pincode}"
        else:
            address_parts.append(pincode)
    
    # If no address found with keywords, look for multi-line text blocks
    if not address_parts:
        potential_address = []
        for line in cleaned_lines:
            line_clean = line.strip()
            line_lower = line_clean.lower()
            if (any(re.search(keyword, line_lower) for keyword in non_address_keywords) or
                re.match(r'^[A-Z][a-z]+\s[A-Z][a-z]+$', line_clean) or
                len(line_clean.split()) <= 1):
                continue
            if (len(line_clean.split()) >= 2 and 
                not line_clean.startswith('+') and
                not '@' in line_clean):
                potential_address.append(line_clean)
        if len(potential_address) >= 2:
            address_parts = potential_address[:3]
    
    # Final cleanup: remove stray single digits or short meaningless parts
    cleaned_address_parts = []
    for part in address_parts:
        part = part.strip()
        if len(part) <= 2 and part.isdigit() and part != pincode:
            continue
        if part:
            cleaned_address_parts.append(part)
    
    # Format the final address properly
    if cleaned_address_parts:
        address = ', '.join(cleaned_address_parts)
        address = re.sub(r'\s*,\s*', ', ', address)
        address = address.replace(" ,", ",")

        # Apply title case, but handle exceptions like 'III' and state codes.
        address_parts = address.split(', ')
        formatted_parts = []
        for part in address_parts:
            # Start with title case for the whole part
            formatted_part = part.title()

            # Correct Roman numerals that were made title-case (e.g., Iii -> III)
            formatted_part = re.sub(r'\bIii\b', 'III', formatted_part)

            # Correct two-letter state codes to be uppercase
            words = formatted_part.split(' ')
            corrected_words = [word.upper() if len(word) == 2 and word.isalpha() else word for word in words]
            formatted_part = ' '.join(corrected_words)
            
            formatted_parts.append(formatted_part)

        address = ', '.join(formatted_parts)

        # Fix dash spacing in block names (e.g., "Block - III" -> "Block-III")
        address = re.sub(r'([A-Za-z]+)\s*-\s*(III)', r'\1-\2', address)

        # Add hyphen before pincode
        address = re.sub(r',\s*(\d{5,6})$', r' - \1', address)

        return address

    return "Not Found"

def extract_name_and_designation(lines):
    """Extracts name and designation based on keywords and positioning."""
    name = None
    designation = None
    designation_keywords = ['director', 'manager', 'engineer', 'strategy', 'delivery', 'officer', 'ceo']
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in designation_keywords):
            designation = line.strip().title()
            for j in range(max(0, i - 2), i):
                potential_name = lines[j].strip()
                if re.match(r'^([A-Z][a-z]*\s?){1,3}$', potential_name.title()):
                    name = potential_name.title()
                    break
            if name: break

    if designation and not name:
        parts = designation.split()
        if len(parts) > 2 and parts[0].isalpha() and parts[1].isalpha():
            name = f"{parts[0]} {parts[1]}"
            
    if not name:
        potential_names = []
        for line in lines:
            if not any(kw in line.lower() for kw in designation_keywords + ['@', '.com', '+91']):
                if re.match(r'^[A-Z][a-zA-Z\s]+$', line.strip()):
                    potential_names.append(line.strip().title())
        if potential_names:
            name = max(potential_names, key=len)

    return name, designation

@app.route('/extract-id-number', methods=['POST'])
def extract_id_number():
    """Extract Aadhar, PAN, and general numbers from an uploaded image."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        image = Image.open(file.stream)
        processed_img, _ = preprocess_and_rotate(image)
        number_results, text_results = extract_text_and_numbers(processed_img)
        print('Extracted numbers:', number_results)  # Debug
        print('Full OCR results:', text_results)  # Debug

        cleaned_numbers = []
        for num in number_results:
            cleaned = re.sub(r'\s+', '', num)
            cleaned_numbers.append(cleaned)

        response = {
            'Aadhar': [num for num in cleaned_numbers if re.match(r'^\d{12}$', num)],
            'PAN': [num for num in cleaned_numbers if re.match(r'^[A-Z]{5}\d{4}[A-Z]$', num)],
            'General Numbers': cleaned_numbers
        }
        print('Response:', response)  # Debug
        return jsonify(response), 200
    except Exception as e:
        print('Error processing image:', str(e))  # Debug
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

@app.route('/upload', methods=['POST'])
def upload_image():
    """Extract business card details (name, email, company, etc.) from an uploaded image."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        try:
            image = Image.open(file.stream)
            processed_img, _ = preprocess_and_rotate(image)
            
            results = reader.readtext(processed_img, detail=0, paragraph=False)
            full_text = ' '.join(results)
            
            print("=== OCR EXTRACTED TEXT ===")
            print("Full text:", full_text)
            print("Individual lines:", results)
            print("========================")
            
            email = extract_email(full_text)
            mobile_number = extract_mobile_number(full_text)
            print("Found mobile number:", mobile_number)  # Debug
            company_number = extract_company_number(full_text)
            print("Found company number:", company_number)  # Debug
            
            all_phone_numbers = re.findall(r'\+91[-\s]*\d{2,4}[-\s]*\d{6,10}(?:\s*(?:ext|extension|x)[-:\s]*\d+)?', full_text, re.IGNORECASE)
            print("All phone-like patterns found:", all_phone_numbers)
            
            website = extract_website(full_text)
            name, designation = extract_name_and_designation(results)
            company = extract_company_name(results)
            if company == "Not Found" and email:
                company = email.split('@')[1].split('.')[0].capitalize()
            address = extract_address(results)
            print("Found address:", address)  # Debug
            
            response_data = {
                "name": name if name else "Not Found",
                "designation": designation if designation else "Not Found",
                "company": company if company else "Not Found",
                "email": email if email else "Not Found",
                "personal_mobile_number": mobile_number if mobile_number else "Not Found",
                "company_number": company_number if company_number else "Not Found",
                "website": website if website else "Not Found",
                "address": address if address else "Not Found",
            }
            return jsonify(response_data), 200
            
        except Exception as e:
            return jsonify({"error": f"An error occurred during processing: {e}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Allowed types: jpg, jpeg, png"}), 400

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
