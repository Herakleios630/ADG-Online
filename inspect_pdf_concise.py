import pdfplumber
import re

pdf_path = 'Konzepte/merged.pdf'

def get_headings(text):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    first_12 = lines[:12]
    all_caps = [l for l in lines if l.isupper() and len(l) > 3]
    seen = set()
    headings = []
    for h in (first_12 + all_caps):
        if h not in seen:
            headings.append(h)
            seen.add(h)
    return headings[:5] # Even more concise

try:
    with pdfplumber.open(pdf_path) as pdf:
        print("TOC Clues:")
        for i in range(51, 54):
            page = pdf.pages[i]
            text = (page.extract_text() or "").split('\n')[:20]
            for line in text:
                if re.search(r'\.{3,}|[IXV\d]{2,3}$', line):
                    print(f"R{i-50}: {line.strip()[:60]}")
        
        print("\nOutline (Rules 1-84 / Merged 52-135):")
        for i in range(51, 135):
            page = pdf.pages[i]
            text = page.extract_text() or ""
            h = get_headings(text)
            print(f"R{i-50}(M{i+1})|C:{len(text)}| {' / '.join(h)}")
except Exception as e:
    print(f"Error: {e}")
