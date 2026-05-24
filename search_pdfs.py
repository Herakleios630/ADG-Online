import pdfplumber
import os

terms = [
    "Charge procedure",
    "Target reaction",
    "Charge movement",
    "If the initial targets do not evade",
    "If all initial targets evade",
    "If not all target evade",
    "Continuing a charge",
    "Evade",
    "Conformation"
]

files = ["Konzepte/merged.pdf", "Konzepte/Errata_ADG_V4_English.pdf"]

for file_path in files:
    print(f"--- Searching {file_path} ---")
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        continue
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                
                # Check for " 43 " or " 47 " on the page as potential rulebook indices
                is_p43 = " 43 " in text or " 43\n" in text or "\n43 " in text
                is_p47 = " 47 " in text or " 47\n" in text or "\n47 " in text

                for term in terms:
                    if term.lower() in text.lower():
                        # Find all occurrences
                        start_pos = 0
                        while True:
                            idx = text.lower().find(term.lower(), start_pos)
                            if idx == -1: break
                            
                            context_start = max(0, idx - 80)
                            context_end = min(len(text), idx + len(term) + 120)
                            excerpt = text[context_start:context_end].replace('\n', ' ')
                            
                            marker = ""
                            if is_p43: marker += "[Likely Rulebook P43] "
                            if is_p47: marker += "[Likely Rulebook P47] "

                            print(f"File: {os.path.basename(file_path)} | Page: {page.page_number} {marker}| Term: '{term}'")
                            print(f"   ...{excerpt}...")
                            print("-" * 40)
                            
                            start_pos = idx + 1
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
