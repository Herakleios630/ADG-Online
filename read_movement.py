import pdfplumber
with pdfplumber.open('Konzepte/merged.pdf') as pdf:
    for i in range(83, 86):
        print(f"--- Page {i+1} ---")
        print(pdf.pages[i].extract_text())
