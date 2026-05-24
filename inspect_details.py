import fitz

def detailed_inspect(path):
    print(f"\n--- Detailed: {path} ---")
    doc = fitz.open(path)
    page = doc[0]
    
    # Check for images to judge scan quality
    images = page.get_images(full=True)
    if images:
        for img in images:
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            print(f"Image on page 1: {pix.width}x{pix.height} pixels, colorspace={pix.colorspace.name if pix.colorspace else 'N/A'}")
            # Calculate approx DPI if image covers the page
            dpi_x = (pix.width / page.rect.width) * 72
            dpi_y = (pix.height / page.rect.height) * 72
            print(f"Approx DPI: {dpi_x:.1f} x {dpi_y:.1f}")
            pix = None
    else:
        print("No images found on page 1.")

    # Search for "Army List" or similar in merged.pdf
    if "merged" in path:
        print("Searching for army list text in merged.pdf...")
        for i in range(min(20, len(doc))):
            text = doc[i].get_text()
            if "List" in text or "Points" in text:
                 print(f"Useful text on Page {i+1}: {text[:150].strip().replace('\n', ' ')}...")
                 break

detailed_inspect("docs/source/new scan/Document_20260522_0001.pdf")
detailed_inspect("Konzepte/merged.pdf")
