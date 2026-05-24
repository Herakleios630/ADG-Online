import fitz
import sys

def inspect_pdf(path):
    print(f"\n--- Inspecting: {path} ---")
    try:
        doc = fitz.open(path)
        page_count = len(doc)
        print(f"Page Count: {page_count}")
        
        # Check first 5 pages and middle pages for text
        text_found = False
        sample_indices = [0, page_count // 2, page_count - 1] if page_count > 2 else range(page_count)
        for i in sample_indices:
            page = doc[i]
            text = page.get_text().strip()
            if text:
                print(f"Page {i+1} Text Snippet: {text[:100].replace('\n', ' ')}...")
                text_found = True
            
            if i == 0 or (page_count > 10 and i == 10): # Representative army-list page check is hard without content knowledge, use page 10 as proxy if it exists
                 print(f"Page {i+1} Dimensions: {page.rect.width} x {page.rect.height}")
        
        if not text_found:
             print("No text layer detected (might be scanned images only).")
        else:
             print("Text layer/OCR detected.")
        doc.close()
    except Exception as e:
        print(f"Error: {e}")

inspect_pdf("docs/source/new scan/Document_20260522_0001.pdf")
inspect_pdf("Konzepte/merged.pdf")
