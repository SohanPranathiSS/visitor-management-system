import streamlit as st
import easyocr
import re
import cv2
import numpy as np
from PIL import Image
from io import BytesIO

# Initialize OCR Reader.
# The 'en' language model is downloaded automatically the first time it's used.
# gpu=False to run on CPU, which is fine for this task.
reader = easyocr.Reader(['en'], gpu=False)

def preprocess_and_rotate(image):
    """
    Preprocesses the image for better OCR results and corrects its orientation.
    """
    img = np.array(image.convert("RGB"))
    
    # Simple rotation check based on image dimensions
    h, w, _ = img.shape
    if h > w:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

    # Convert to grayscale for better processing
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply a sharpening filter to make text clearer
    sharpen_kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharp = cv2.filter2D(gray, -1, sharpen_kernel)

    # Binarization using Otsu's thresholding
    _, thresh = cv2.threshold(sharp, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return thresh, img

def extract_email(text):
    """
    Extracts an email address from the given text using a regular expression.
    """
    match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    return match.group(0) if match else None

def extract_mobile_number(text):
    """
    Extracts a 10-digit mobile number, often preceded by +91.
    """
    # This regex specifically looks for a 10-digit number that follows a country code.
    match = re.search(r'(\+91[-\s]?)?(\d{10})\b', text)
    return match.group(0).strip() if match else None

def extract_company_number(text):
    """
    Extracts a company landline number, which may include an extension.
    """
    # This regex looks for a number with an area code and an optional extension.
    match = re.search(r'(\+91[-\s]?\d{2,4}[-\s]?\d{6,8}(\s?ext[:\s]?\s?\d+)?)', text)
    if match:
        # Check if it's not the same as the mobile number already found
        mobile_match_simple = re.search(r'\d{10}$', match.group(0))
        if mobile_match_simple:
             # Avoid re-capturing the mobile number here
             if re.search(r'ext', text, re.IGNORECASE): # If ext is present, it's likely a company number
                 return match.group(0).strip()
             return None
        return match.group(0).strip()
    return None


def extract_website(text):
    """
    Extracts a website URL from the text. This regex looks for patterns like
    www.domain.com or domain.com.
    """
    match = re.search(r'\b(www\.|https?://)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?\b', text)
    if match:
        # Prioritize matches containing common TLDs to avoid matching things like "Block-III"
        if any(tld in match.group(0) for tld in ['.com', '.in', '.org', '.net']):
            return match.group(0)
    return None

def extract_company_name(lines):
    """
    Extracts the company name. It looks for common company suffixes or prioritizes
    text that is likely a company name based on common patterns.
    """
    for line in lines:
        if any(keyword in line.lower() for keyword in ['services', 'solutions', 'pvt', 'ltd', 'limited', 'software']):
            return line.strip().title()
    # As a fallback, derive from email if available, but this is less reliable
    return "Not Found" # Default if no other logic works

def extract_address(lines):
    """
    Extracts a multi-line address by finding the first line that looks
    like an address and then consuming subsequent lines until a non-address
    line is found.
    """
    address_parts = []
    # Keywords to find the start or any part of an address.
    address_keywords = [
        'block', 'house', 'road', 'street', 'nagar', 'gumpet', # Building/street parts
        'hyderabad', 'ts', 'india', # City/State/Country
        r'\b\d{5,6}\b' # Pin code
    ]
    # Keywords for things that are definitely NOT address lines
    non_address_keywords = ['@', 'www', '.com', 'phone', 'mobile', 'email', 'director', 'manager', 'services', 'solutions', 'pvt', 'ltd', r'\+91']
    
    start_index = -1

    # 1. Find the starting line of the address
    for i, line in enumerate(lines):
        line_lower = line.lower()
        # A line is a potential start if it has address keywords but not non-address keywords.
        if any(re.search(keyword, line_lower) for keyword in address_keywords) and not any(re.search(keyword, line_lower) for keyword in non_address_keywords):
            start_index = i
            break
            
    if start_index != -1:
        # 2. We found a start. Collect lines from this point forward until we hit a non-address line.
        for i in range(start_index, len(lines)):
            line = lines[i].strip()
            line_lower = line.lower()
            
            # If the current line is obviously not an address, stop.
            if any(re.search(keyword, line_lower) for keyword in non_address_keywords):
                break
                
            # If the line is short and looks like a name/designation, stop.
            if len(line.split()) < 4 and any(kw in line_lower for kw in ['naik', 'delivery']):
                 break
            
            address_parts.append(line)
        
    if address_parts:
        # Join the parts with a comma and space, then capitalize correctly.
        return ', '.join(address_parts).title().replace(" ,", ",")
    
    return "Not Found"

def extract_name_and_designation(lines):
    """
    Extracts the name and designation. It looks for designation keywords and then
    assumes a nearby capitalized line is the name.
    """
    name = None
    designation = None
    designation_keywords = ['director', 'manager', 'engineer', 'strategy', 'delivery', 'officer', 'ceo']
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in designation_keywords):
            designation = line.strip().title()
            # Look for a name in the preceding lines. Names are often proper nouns.
            for j in range(max(0, i - 2), i):
                potential_name = lines[j].strip()
                # A simple heuristic: a name is usually 1-3 words, all capitalized.
                if re.match(r'^([A-Z][a-z]*\s?){1,3}$', potential_name.title()):
                    name = potential_name.title()
                    break
            if name:
                break # Found both, can stop searching
                
    # If designation found but name is not, check the same line
    if designation and not name:
        parts = designation.split()
        # A simple check if the first part of the designation line is a name
        if len(parts) > 2 and parts[0].isalpha() and parts[1].isalpha():
             name = f"{parts[0]} {parts[1]}"


    # If still no name, find the most prominent text that isn't something else
    if not name:
        # This is a fallback heuristic
        all_text = ' '.join(lines)
        potential_names = []
        for line in lines:
             # If a line doesn't contain other info, it might be the name
             if not any(kw in line.lower() for kw in designation_keywords + ['@', '.com', '+91']):
                 if re.match(r'^[A-Z][a-zA-Z\s]+$', line.strip()):
                     potential_names.append(line.strip().title())
        if potential_names:
            # Pick the longest as it's often the full name
            name = max(potential_names, key=len)

    return name, designation

# --- Streamlit App UI ---
st.set_page_config(layout="wide")
st.title("📇 Business Card Parser")
st.write("Upload an image of a business card, and the tool will extract the key information.")

uploaded_file = st.file_uploader("Upload Business Card Image", type=["jpg", "jpeg", "png"])

if uploaded_file:
    image = Image.open(uploaded_file)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.image(image, caption="Uploaded Business Card", use_column_width=True)

    with col2:
        with st.spinner("🤖 Performing OCR and extracting information..."):
            # Preprocess the image (rotate and clean)
            processed_img, original_rotated_img = preprocess_and_rotate(image)

            # Perform OCR to get a list of recognized text lines
            results = reader.readtext(processed_img, detail=0, paragraph=False)
            full_text = ' '.join(results)

            # --- Extraction Logic ---
            email = extract_email(full_text)
            mobile_number = extract_mobile_number(full_text)
            company_number = extract_company_number(full_text)
            website = extract_website(full_text)
            
            # For company, name, and address, it's better to work with lines
            name, designation = extract_name_and_designation(results)
            company = extract_company_name(results)
            # If company not found, try to derive from email
            if company == "Not Found" and email:
                company = email.split('@')[1].split('.')[0].capitalize()
                
            address = extract_address(results)

            # --- Display Results ---
            st.subheader("📝 Extracted Information")
            st.info(f"**Name:** {name if name else 'Not Found'}")
            st.info(f"**Designation:** {designation if designation else 'Not Found'}")
            st.info(f"**Company:** {company if company else 'Not Found'}")
            st.info(f"**Email:** {email if email else 'Not Found'}")
            st.info(f"**Personal Mobile Number:** {mobile_number if mobile_number else 'Not Found'}")
            st.info(f"**Company Number:** {company_number if company_number else 'Not Found'}")
            st.info(f"**Website:** {website if website else 'Not Found'}")
            st.info(f"**Address:** {address if address else 'Not Found'}")

            # Optional: Display the processed image and raw text for debugging
            with st.expander("Show processing details"):
                st.image(processed_img, caption="Processed Image (Grayscale & Rotated)")
                st.text_area("Raw OCR Text Output", ' '.join(results), height=150)

