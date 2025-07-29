import streamlit as st
import cv2
import numpy as np
from PIL import Image
import easyocr
import re

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'])

# Function to extract only numbers (including Aadhar/PAN patterns)
def extract_numbers_from_text(text_list):
    combined_text = " ".join(text_list)
    
    # Define regex patterns
    patterns = {
        "Aadhar": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
        "PAN": r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b",
        "General Numbers": r"\b\d{6,16}\b"  # generic long numbers
    }

    found = {}
    for key, pattern in patterns.items():
        matches = re.findall(pattern, combined_text)
        if matches:
            found[key] = matches
    return found

def extract_text_and_numbers(image_np):
    results = reader.readtext(image_np)
    text_list = [res[1] for res in results]
    number_results = extract_numbers_from_text(text_list)
    return number_results, results

def draw_boxes(image_np, results):
    for (bbox, text, prob) in results:
        (top_left, top_right, bottom_right, bottom_left) = bbox
        top_left = tuple(map(int, top_left))
        bottom_right = tuple(map(int, bottom_right))
        image_np = cv2.rectangle(image_np, top_left, bottom_right, (0, 255, 0), 2)
        image_np = cv2.putText(image_np, text, top_left, cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
    return image_np

def main():
    st.set_page_config(page_title="Card Number Extractor", layout="centered")
    st.title("🔍 Aadhar / PAN Card Number Extractor (EasyOCR)")
    st.markdown("Upload an image or take a photo of your **Aadhar** or **PAN** card. This app will show **only the numbers**, ignoring extra text.")

    mode = st.radio("Select input mode:", ["Upload Image", "Live Camera"])

    if mode == "Upload Image":
        uploaded_file = st.file_uploader("Upload card image", type=["jpg", "jpeg", "png"])
        if uploaded_file is not None:
            image = Image.open(uploaded_file).convert("RGB")
            image_np = np.array(image)
            st.image(image, caption="Uploaded Image", use_column_width=True)

            if st.button("Extract Numbers"):
                number_results, results = extract_text_and_numbers(image_np)
                image_with_boxes = draw_boxes(image_np.copy(), results)

                st.subheader("🔢 Extracted Numbers:")
                if number_results:
                    for key, nums in number_results.items():
                        st.write(f"**{key} Numbers:**")
                        for num in nums:
                            st.code(num)
                else:
                    st.warning("No valid Aadhar/PAN numbers found.")

                st.image(image_with_boxes, caption="OCR Output", use_column_width=True)

    elif mode == "Live Camera":
        picture = st.camera_input("Capture card using webcam")
        if picture is not None:
            image = Image.open(picture).convert("RGB")
            image_np = np.array(image)
            st.image(image, caption="Captured Image", use_column_width=True)

            if st.button("Extract Numbers"):
                number_results, results = extract_text_and_numbers(image_np)
                image_with_boxes = draw_boxes(image_np.copy(), results)

                st.subheader("🔢 Extracted Numbers:")
                if number_results:
                    for key, nums in number_results.items():
                        st.write(f"**{key} Numbers:**")
                        for num in nums:
                            st.code(num)
                else:
                    st.warning("No valid Aadhar/PAN numbers found.")

                st.image(image_with_boxes, caption="OCR Output", use_column_width=True)

if __name__ == "__main__":
    main()
