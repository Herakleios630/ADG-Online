import pdfplumber
import os

terms = [
    "Charge procedure",
    "Target reaction",
    "If all initial targets evade",
    "Charge movement",
    "Evade",
    "Continuing a charge"
]

files = ["Konzepte/merged.pdf"]

for file_path in files:
    if not os.path.exists(file_path): continue
    with pdfplumber.open(file_path) as pdf:
        # Based on index, P43 is likely around page 50-60 of the PDF, P47 shortly after.
        # Index showed p43 for "Continuing a charge" and p47 for "Evade".
        # Let's search pages 10 to 100 to find the actual page numbers.
        for page in pdf.pages:
            text = page.extract_text()
            if not text: continue
            
            # Look for page numbers at bottom or top - usually "43" or "47" on their respective pages
            # We also look for specific headers
            if "CHARGE PROCEDURE" in text.upper() or "TARGET REACTION" in text.upper() or "EVADE" in text.upper():
                # Check if it contains the page markers 43 or 47
                lines = text.split("\n")
                page_label = "unknown"
                for line in lines[:5] + lines[-5:]:
                    if "43" in line: page_label = "43"
                    if "47" in line: page_label = "47"
                
                print(f"--- Page {page.page_number} (Label: {page_label}) ---")
                print(text)
                print("="*80)
