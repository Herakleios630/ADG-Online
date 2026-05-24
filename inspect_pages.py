import pdfplumber
keywords = ['unit', 'group', 'move', 'order', 'choice', 'complete', 'finish', 'another']
include_terms = ['second move', 'third move', 'move another unit', 'complete the move', 'one move', 'movement in the order of choice', 'multiple moves']

with pdfplumber.open('Konzepte/merged.pdf') as pdf:
    # Pages around 75, 84, 85, 106, 116, 127 seem relevant.
    target_pages = [74, 75, 83, 84, 85, 105, 106, 115, 116, 126, 127]
    for i in target_pages:
        if i >= len(pdf.pages): continue
        page = pdf.pages[i]
        text = page.extract_text()
        if text:
            print(f"--- Page {i+1} ---")
            print(text)
            print("-" * 20)
