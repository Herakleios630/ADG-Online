import fitz

def inspect_pdf(path):
    try:
        doc = fitz.open(path)
        total_pages = len(doc)
        
        indices = [0, total_pages // 2, total_pages - 1]
        results = []
        
        for idx in indices:
            page = doc[idx]
            text = page.get_text()
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            has_text = len(lines) > 0
            # Get first 4 header/list-like lines
            cues = lines[:4]
            results.append({
                "page": idx + 1,
                "has_text": has_text,
                "cues": cues
            })
            
        print(f"Total Pages: {total_pages}")
        for res in results:
            print(f"--- Page {res['page']} ---")
            print(f"Useful OCR: {'Yes' if res['has_text'] else 'No'}")
            print("Cues:")
            for cue in res['cues']:
                print(f"  - {cue}")
    except Exception as e:
        print(f"Error: {e}")

inspect_pdf("docs/source/new scan/Ancient_Period.pdf")
