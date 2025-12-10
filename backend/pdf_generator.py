from io import BytesIO
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import black

def clean_text(text):
    """
    Escapes XML special characters for ReportLab and handles inline markdown styling.
    """
    # 1. Escape XML special characters to prevent errors in ReportLab parser
    text = text.replace('&', '&').replace('<', '<').replace('>', '>')
    
    # 2. Handle bold (**text** or __text__)
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'__(.*?)__', r'<b>\1</b>', text)
    
    # 3. Handle italic (*text* or _text_)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = re.sub(r'_(.*?)_', r'<i>\1</i>', text)
    
    # 4. Handle inline code (`text`)
    text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', text)

    return text

def convert_markdown_to_pdf(markdown_text: str) -> BytesIO:
    """
    Converts markdown text to a PDF file in-memory using ReportLab.
    """
    buffer = BytesIO()
    # Set up the document with reasonable margins
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    story = []
    styles = getSampleStyleSheet()

    # Define Custom Styles for Markdown elements
    
    # Heading 1
    styles.add(ParagraphStyle(
        name='MarkdownH1', 
        parent=styles['Heading1'], 
        fontSize=18, 
        leading=22,
        spaceAfter=12,
        textColor=black
    ))
    
    # Heading 2
    styles.add(ParagraphStyle(
        name='MarkdownH2', 
        parent=styles['Heading2'], 
        fontSize=16, 
        leading=20,
        spaceAfter=10,
        textColor=black
    ))
    
    # Heading 3
    styles.add(ParagraphStyle(
        name='MarkdownH3', 
        parent=styles['Heading3'], 
        fontSize=14, 
        leading=18,
        spaceAfter=8,
        textColor=black
    ))
    
    # Normal Paragraph
    styles.add(ParagraphStyle(
        name='MarkdownP', 
        parent=styles['Normal'], 
        fontSize=11, 
        leading=14,
        spaceAfter=8
    ))
    
    # List Items (Bullet & Numbered)
    styles.add(ParagraphStyle(
        name='MarkdownBullet', 
        parent=styles['Normal'], 
        fontSize=11, 
        leading=14,
        leftIndent=20,
        spaceAfter=4
    ))
    
    lines = markdown_text.split('\n')
    
    for line in lines:
        stripped_line = line.strip()
        
        # Skip empty lines, add a small spacer for visual separation if needed
        if not stripped_line:
            story.append(Spacer(1, 6))
            continue
            
        # Headers
        if stripped_line.startswith('# '):
            text = clean_text(stripped_line[2:].strip())
            story.append(Paragraph(text, styles['MarkdownH1']))
            
        elif stripped_line.startswith('## '):
            text = clean_text(stripped_line[3:].strip())
            story.append(Paragraph(text, styles['MarkdownH2']))
            
        elif stripped_line.startswith('### '):
            text = clean_text(stripped_line[4:].strip())
            story.append(Paragraph(text, styles['MarkdownH3']))
            
        # Unordered Lists
        elif stripped_line.startswith('- ') or stripped_line.startswith('* '):
            text = clean_text(stripped_line[2:].strip())
            story.append(Paragraph(f"• {text}", styles['MarkdownBullet']))
            
        # Numbered Lists (e.g., "1. Item")
        elif re.match(r'^\d+\.\s', stripped_line):
            match = re.match(r'^(\d+\.)\s+(.*)', stripped_line)
            if match:
                number_part = match.group(1)
                content_part = clean_text(match.group(2))
                story.append(Paragraph(f"{number_part} {content_part}", styles['MarkdownBullet']))
            else:
                # Fallback if regex matched but grouping failed (unlikely)
                text = clean_text(stripped_line)
                story.append(Paragraph(text, styles['MarkdownP']))

        # Regular Paragraph
        else:
            text = clean_text(stripped_line)
            story.append(Paragraph(text, styles['MarkdownP']))

    doc.build(story)
    buffer.seek(0)
    return buffer