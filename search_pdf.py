import pdfplumber
keywords = ['second move', 'third move', 'move another unit', 'complete the move', 'one move', 'movement in the order of choice', 'multiple moves']
with pdfplumber.open('Konzepte/merged.pdf') as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            lines = text.split('\n')
            matches = [line for line in lines if any(kw in line.lower() for kw in keywords)]
            if matches:
                 print(f"--- Page {i+1} ---")
                 for match in matches:
                     print(match)
