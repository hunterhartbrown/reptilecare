"""
Convert Excel files to JSON for enclosure builder
Reads from:
- Reptile Care Sheet.xlsx: Animal data with approved enclosure IDs
- Enclosure Products.xlsx: Enclosure product data
"""

import pandas as pd
import json
import os

def convert_reptile_care_sheet():
    """Convert Reptile Care Sheet.xlsx to JSON"""
    excel_path = '../data/Reptile Care Sheet.xlsx'
    
    if not os.path.exists(excel_path):
        print(f"Error: {excel_path} not found")
        return None
    
    df = pd.read_excel(excel_path, engine='openpyxl')
    
    # Convert to JSON
    data = df.to_dict(orient='records')
    
    # Save to JSON file
    json_path = '../data/reptile_care_sheet.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Converted {excel_path} to {json_path}")
    return data

def convert_enclosure_products():
    """Convert Enclosure Products.xlsx to JSON"""
    excel_path = '../data/Enclosure Products.xlsx'
    
    if not os.path.exists(excel_path):
        print(f"Error: {excel_path} not found")
        return None
    
    df = pd.read_excel(excel_path, engine='openpyxl')
    
    # Filter to only "Show" status enclosures
    if 'Show or Hide' in df.columns:
        df = df[df['Show or Hide'].str.strip().str.lower() == 'show']
    
    # Convert to JSON
    data = df.to_dict(orient='records')
    
    # Save to JSON file
    json_path = '../data/enclosure_products.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Converted {excel_path} to {json_path} (filtered to Show only)")
    return data

if __name__ == '__main__':
    print("Converting Excel files to JSON...")
    print("=" * 50)
    
    reptile_data = convert_reptile_care_sheet()
    enclosure_data = convert_enclosure_products()
    
    print("=" * 50)
    print("Conversion complete!")

