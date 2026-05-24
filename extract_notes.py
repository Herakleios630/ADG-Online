import pdfplumber
import fitz
import sys
import re

errata_path = r"Konzepte\Errata_ADG_V4_English.pdf"
merged_path = r"Konzepte\merged.pdf"

keywords = ["charge", "evade", "conformation", "conform", "pursuit", "contact"]

def process_rules():
    print("--- Rules Summary (Pages 42-53 via Merged 93-104) ---")
    with pdfplumber.open(merged_path) as pdf:
        # Rules pages 42-53 correspond to merged pages 93-104 (0-indexed 92-103)
        for i in range(92, 104):
            page = pdf.pages[i]
            # Page label often corresponds to physical page number or specific label
            label = page.page_number
            text_lines = page.extract_text().split("\n")
            cleaned_lines = [line.strip() for line in text_lines if line.strip()][:20]
            
            # Analyze page content for heavy elements
            # Simple heuristic based on word count/whitespace/layout could be complex, 
            # I will use text density as a proxy or just look for keywords like "Diagram" or "Table"
            full_text = page.extract_text().lower()
            note = ""
            if "table" in full_text or "|" in full_text: note = "[Table-heavy context]"
            elif "diagram" in full_text or "figure" in full_text: note = "[Diagram-heavy context]"
            elif "example" in full_text: note = "[Example-heavy context]"
            
            print(f"Page Label: {i-92+42} (Merged {i+1})")
            for line in cleaned_lines[0:20]:
                if len(line) > 0:
                    print(f"  {line}")
            if note: print(f"  Note: {note}")
            print("-" * 20)

def process_errata():
    print("\n--- Errata Keywords Search ---")
    doc = fitz.open(errata_path)
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        for line in text.split("\n"):
            for kw in keywords:
                if kw.lower() in line.lower():
                    # Print matching line
                    print(f"[Errata p{page_num+1}] {line.strip()}")
    doc.close()

if __name__ == "__main__":
    process_rules()
    process_errata()
