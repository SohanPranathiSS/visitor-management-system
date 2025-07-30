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
# CORS configuration for both endpoints - allow your frontend domain
CORS(app, resources={
    r"/extract-id-number": {"origins": ["http://localhost:3000", "https://your-frontend-domain.onrender.com"]}, 
    r"/upload": {"origins": ["http://localhost:3000", "https://your-frontend-domain.onrender.com"]}
})

# Configuration for file uploads
app.config['UPLOAD_FOLDER'] = 'static/uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

# Initialize OCR Reader (one-time setup for efficiency)
reader = easyocr.Reader(['en'], gpu=False)

# --- New: Set of placeholder phrases to ignore ---
PLACEHOLDER_PHRASES = {
    'your name here', 'your name', 'company name', 'your company name', 'job position',
    'your position here', 'email address goes here', 'website goes here',
    'address goes here, your city', 'address goes here', 'your logo', 'company tagline',
    '123 anywhere st., any city'
}

# --- New: Set of public email domains to avoid misinterpreting as company names ---
PUBLIC_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'protonmail.com'
}


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
    # Patterns to find mobile numbers, including those with context like "M:" or "Mob:"
    mobile_patterns = [
        r'(?:m|mob|mobile)?[:\s]*(\+91[-\s]?)?([6-9]\d{9})\b',
        r'\b([6-9]\d{9})\b'
    ]
    
    for pattern in mobile_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            # Reconstruct the number from tuple results if needed
            number = "".join(filter(None, match)).strip()
            # Ensure it is not part of a larger number or extension
            if not re.search(r'(?:ext|extension|x|fax)\s*[:\s]*' + re.escape(number), text, re.IGNORECASE):
                 return number
    
    return None

def extract_company_number(text):
    """Extracts a company landline number, potentially with context or an extension."""
    # Patterns for landlines, including context like "Tel:", "Office:", "O:", etc.
    patterns = [
        r'(?:tel|phone|ph|o|office|work|fax)[:\s]*([\+]\d{1,3}[-\s]?)?(\(?\d{2,5}\)?[-\s]?\d{6,8}(\s*(?:ext|extension|x)[-:\s]*\d+)?)',
        r'(\+91[-\s]*(?:0?[1-5]\d|40|80|11|22|33|44)[-\s]*\d{6,8})(\s*(?:ext|extension|x)[-:\s]*\d+)?'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Join groups to form the full number string
            full_number = "".join([g for g in match.groups() if g is not None]).strip()
            # Avoid classifying a mobile number as a company number
            clean_number = re.sub(r'[^\d]', '', full_number)
            if len(clean_number) == 10 and clean_number.startswith(('6','7','8','9')):
                continue
            return full_number
    
    return None

def extract_website(text):
    """Extracts a website URL, improved to not misidentify email addresses."""
    # Regex to find URLs, with or without http/https, including common TLDs
    match = re.search(r'\b(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9:%._\+~#=]{2,256}\.[a-zA-Z]{2,6}\b', text, re.IGNORECASE)
    if match:
        url = match.group(0)
        # Exclude email addresses from being matched as websites
        if '@' in url:
            return None
        if any(tld in url for tld in ['.com', '.in', '.org', '.net', '.co', '.io', '.tech']):
            return url
    return None

def extract_company_name(lines):
    """Extracts company name using a broader list of keywords."""
    # A more generic list of keywords common in company names
    company_keywords = [
        'pvt', 'ltd', 'limited', 'llp', 'inc', 'corp', 'solutions', 'services', 
        'industries', 'group', 'associates', 'consulting', 'global', 'technologies', 'software'
    ]
    for line in lines:
        if any(keyword in line.lower() for keyword in company_keywords):
            return line.strip().title()
    # Check for a line that is all uppercase and short, often a company name
    for line in lines:
        if line.isupper() and 2 < len(line.split()) < 5:
            return line.title()
    return "Not Found"

def extract_address(lines):
    """Extracts address by identifying generic address-related keywords."""
    address_parts = []
    address_keywords = [
        'block', 'house', 'road', 'street', 'avenue', 'lane', 'floor', 'building', 
        'marg', 'sector', 'pincode', 'india', r'\b\d{5,6}\b', 'nagar', 'park', 'ave'
    ]
    non_address_keywords = ['@', 'www', '.com', 'phone', 'mobile', 'email', 'pvt', 'ltd', r'\+91', 'director', 'manager']
    
    cleaned_lines = []
    for line in lines:
        cleaned_line = line.strip()
        cleaned_line = re.sub(r'[Ii][Ii][lI](?=\s|,|$)', 'III', cleaned_line, flags=re.IGNORECASE)
        cleaned_line = cleaned_line.replace(';', ',')
        if cleaned_line:
            cleaned_lines.append(cleaned_line)
    
    start_index = -1
    for i, line in enumerate(cleaned_lines):
        if any(re.search(keyword, line.lower()) for keyword in address_keywords):
            if not any(re.search(keyword, line.lower()) for keyword in non_address_keywords):
                start_index = i
                break
    
    if start_index != -1:
        for i in range(start_index, len(cleaned_lines)):
            line = cleaned_lines[i].strip()
            line_lower = line.lower()
            if not line: continue
            
            # Stop if non-address content is found
            if any(re.search(keyword, line_lower) for keyword in non_address_keywords): break
            
            # Skip lines that look like names but not addresses
            words = line.split()
            if len(words) in [2, 3] and all(word.isalpha() for word in words):
                if not any(re.search(keyword, line_lower) for keyword in address_keywords):
                    continue  # Skip this line as it's likely a name

            address_parts.append(line)
            # Corrected line: removed erroneous parentheses from line_lower
            if len(address_parts) >= 2 and any(re.search(keyword, line_lower) for keyword in ['india', r'\b\d{5,6}\b']):
                break
    
    pincode = None
    for line in cleaned_lines:
        pincode_match = re.search(r'\b(\d{6})\b', line)
        if pincode_match:
            pincode = pincode_match.group(1)
            break
    
    if pincode and not any(pincode in part for part in address_parts):
        address_parts.append(pincode)
        
    if address_parts:
        address = ', '.join(part for part in address_parts if part).strip()
        address = re.sub(r'\s*,\s*', ', ', address).replace(" ,", ",")
        
        address_parts_formatted = address.split(', ')
        final_parts = []
        for part in address_parts_formatted:
            formatted_part = part.title()
            formatted_part = re.sub(r'\bIii\b', 'III', formatted_part)
            words = formatted_part.split(' ')
            corrected_words = [word.upper() if len(word) == 2 and word.isalpha() else word for word in words]
            final_parts.append(' '.join(corrected_words))
        
        address = ', '.join(final_parts)
        address = re.sub(r'([A-Za-z]+)\s*-\s*(III)', r'\1-\2', address)
        address = re.sub(r',\s*(\d{5,6})$', r' - \1', address)
        return address

    return "Not Found"


def extract_name_and_designation(lines):
    """Extracts name and designation using a more robust filtering approach."""
    name = None
    designation = None
    
    designation_keywords = [
        'director', 'manager', 'engineer', 'strategy', 'delivery', 'officer', 'ceo', 'cto', 
        'cfo', 'coo', 'founder', 'partner', 'consultant', 'president', 'executive', 
        'analyst', 'developer', 'designer', 'architect', 'head', 'lead', 'specialist', 'project manager'
    ]
    
    # More generic list of keywords indicating a line is NOT a name.
    non_name_keywords = [
        # Contact/Web
        '@', '.com', 'www', 'http', '+', 'tel', 'mob', 'email', 'website',
        # Company
        'pvt', 'ltd', 'inc', 'corp', 'solutions', 'services', 'technologies', 'industries', 'llp', 'group',
        # Address
        'road', 'street', 'floor', 'lane', 'marg', 'sector', 'pincode', 'nagar', 'house', 
        'block', 'building', 'avenue', 'india' # Removed city-specific names
    ]
    
    candidates = []
    for line in lines:
        line_lower = line.lower()
        if not any(char.isdigit() for char in line) and not any(kw in line_lower for kw in non_name_keywords):
            # A name is unlikely to have more than 4 words
            if 0 < len(line.split()) < 5:  
                candidates.append(line.strip())

    remaining_candidates = []
    for line in candidates:
        if any(re.search(r'\b' + keyword + r'\b', line.lower()) for keyword in designation_keywords):
            if not designation:
                designation = line.title()
        else:
            remaining_candidates.append(line)

    if remaining_candidates:
        # Prioritize candidates with 2 or 3 words
        name_candidates = [c for c in remaining_candidates if len(c.split()) in [2, 3]]
        
        if name_candidates:
            # Choose the longest among plausible candidates
            name = max(name_candidates, key=len).title()
        elif remaining_candidates:
            # Fallback to the longest remaining candidate if no 2- or 3-word names are found.
            name = max(remaining_candidates, key=len).title()

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

        cleaned_numbers = [re.sub(r'\s+', '', num) for num in number_results]

        response = {
            'Aadhar': [num for num in cleaned_numbers if re.match(r'^\d{12}$', num)],
            'PAN': [num for num in cleaned_numbers if re.match(r'^[A-Z]{5}\d{4}[A-Z]$', num)],
            'General Numbers': cleaned_numbers
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

@app.route('/upload', methods=['POST'])
def upload_image():
    """Extract business card details using generalized functions."""
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
            
            # --- New: Filter out placeholder text from results ---
            filtered_results = [line for line in results if line.lower().strip() not in PLACEHOLDER_PHRASES]
            full_text = ' '.join(filtered_results)
            
            # Extract all details using the improved functions on filtered data
            email = extract_email(full_text)
            mobile_number = extract_mobile_number(full_text)
            company_number = extract_company_number(full_text)
            website = extract_website(full_text)
            name, designation = extract_name_and_designation(filtered_results)
            company = extract_company_name(filtered_results)

            # Improved fallback for company name from email
            if company == "Not Found" and email:
                domain = email.split('@')[1]
                # --- New: Check against public email domains ---
                if domain.lower() not in PUBLIC_EMAIL_DOMAINS:
                    tlds = ['.com', '.in', '.org', '.net', '.co.uk', '.co.in', '.co']
                    # Sort by length to match longer TLDs first (e.g., .co.in before .in)
                    for tld in sorted(tlds, key=len, reverse=True):
                        if domain.endswith(tld):
                            domain = domain[:-len(tld)]
                            break
                    company = domain.replace('-', ' ').title()

            address = extract_address(filtered_results)
            
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
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
