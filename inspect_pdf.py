import pdfplumber
import re

pdf_path = 'Konzepte/merged.pdf'
rules_offset = 51  # 0-indexed page 51 is Rules page 1

def get_headings(text):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    first_12 = lines[:12]
    all_caps = [l for l in lines if l.isupper() and len(l) > 3]
    # Deduplicate while preserving order
    seen = set()
    headings = []
    for h in first_12 + all_caps:
        if h not in seen:
            headings.append(h)
            seen.add(h)
    return headings

try:
    with pdfplumber.open(pdf_path) as pdf:
        print("--- TOC/Index Clues (Rules 1-3) ---")
        for i in range(51, 54):
            page = pdf.pages[i]
            text = page.extract_text() or ""
            print(f"Rules Page {i-50} (Merged {i+1}):")
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            for line in lines[:30]: # Look a bit deeper for TOC
                if re.search(r'\.{3,}|[IXV\d]{1,3}$', line):
                    print(f"  {line}")
        
        print("\n--- Page Outline ---")
        for i in range(51, 135):
            page = pdf.pages[i]
            text = page.extract_text() or ""
            char_count = len(text)
            headings = get_headings(text)
            print(f"Rules {i-50} (M {i+1}) | Chars: {char_count}")
            for h in headings[:15]: # Limit output
                print(f"  - {h}")
except Exception as e:
    print(f"Error: {e}")
