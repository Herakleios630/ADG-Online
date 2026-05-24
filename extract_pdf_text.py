import fitz

def extract_text(path, max_lines=40):
    try:
        doc = fitz.open(path)
        lines = []
        for page in doc:
            text = page.get_text()
            for line in text.split('\n'):
                stripped = line.strip()
                if stripped:
                    lines.append(stripped)
                    if len(lines) >= max_lines:
                        break
            if len(lines) >= max_lines:
                break
        
        print("\n".join(lines))
    except Exception as e:
        print(f"Error: {e}")

extract_text("docs/source/new scan/Document_20260522_0001.pdf")
