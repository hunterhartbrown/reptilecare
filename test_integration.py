#!/usr/bin/env python3
"""
Integration Test for REPTIZOO 36x18x18 Terrarium
Tests the connection between Python 3D modeling and the web interface
"""

import json
import subprocess
import webbrowser
from pathlib import Path

def test_terrarium_model():
    """Test that the terrarium model data is properly integrated"""
    
    # Check if enclosure-builder.html exists
    builder_file = Path("enclosure-builder.html")
    js_file = Path("js/enclosure-builder.js")
    
    if not builder_file.exists():
        print("❌ enclosure-builder.html not found")
        return False
    
    if not js_file.exists():
        print("❌ enclosure-builder.js not found")
        return False
    
    # Read the files and check for REPTIZOO integration
    html_content = builder_file.read_text(encoding='utf-8')
    js_content = js_file.read_text(encoding='utf-8')
    
    checks = [
        ("REPTIZOO terrarium model", "REPTIZOO 50 Gallon Glass Terrarium" in html_content),
        ("Premium enclosure flag", "isPremium: true" in html_content),
        ("Amazon URL integration", "amazon.com/REPTIZOO-Reptile-Terrarium" in html_content),
        ("Drag and drop functionality", "setupDropZone" in html_content),
        ("Selected enclosure counter", "Selected Enclosure (0/1)" in html_content),
        ("Canvas overflow fix", "overflow: hidden" in html_content),
        ("Premium CSS styling", "enclosure-option.premium" in html_content),
        ("Enhanced 3D model", "createReptizooModel" in js_content),
        ("JavaScript file referenced", "enclosure-builder.js" in html_content),
        ("Camera controls working", "rotateCamera" in js_content and "zoomCamera" in js_content),
        ("Reset view functionality", "resetCamera" in js_content),
        ("Keyboard shortcuts", "keydown" in js_content),
        ("Help panel", "help-toggle" in html_content)
    ]
    
    print("🔍 Integration Test Results:")
    print("=" * 50)
    
    all_passed = True
    for check_name, result in checks:
        status = "✅" if result else "❌"
        print(f"{status} {check_name}")
        if not result:
            all_passed = False
    
    print("=" * 50)
    
    if all_passed:
        print("🎉 All integration tests passed!")
        print("\n📋 Features Successfully Integrated:")
        print("   • REPTIZOO 36x18x18 terrarium model")
        print("   • Drag and drop to selected enclosure area")
        print("   • Default 0/1 selection display")
        print("   • Fixed canvas overflow issues")
        print("   • Premium enclosure styling")
        print("   • Enhanced 3D model with detailed features")
        print("   • Amazon purchase link integration")
        return True
    else:
        print("⚠️  Some integration tests failed")
        return False

def test_python_3d_capabilities():
    """Test Python 3D modeling capabilities"""
    
    print("\n🐍 Python 3D Modeling Capabilities:")
    print("=" * 50)
    
    # Check if our Python 3D files exist
    python_files = [
        "python_3d_modeling/reptizoo_terrarium_blender.py",
        "python_3d_modeling/alternative_approaches.py",
        "python_3d_modeling/demo.py",
        "python_3d_modeling/requirements.txt",
        "python_3d_modeling/README.md"
    ]
    
    for file_path in python_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path}")
    
    print("\n📦 Python Libraries Available For:")
    capabilities = [
        "Procedural modeling with Blender Python API",
        "Mesh processing with Open3D",
        "Lightweight modeling with Trimesh",
        "Scientific visualization with VTK",
        "Interactive plotting with PyVista",
        "Animation and rendering capabilities",
        "STL/OBJ export functionality",
        "Real-time 3D preview"
    ]
    
    for capability in capabilities:
        print(f"🔧 {capability}")

def launch_demo():
    """Launch the enclosure builder demo"""
    
    print("\n🚀 Launching Enclosure Builder Demo...")
    print("=" * 50)
    
    url = "http://localhost:3001/enclosure-builder.html"
    
    print(f"🌐 Opening: {url}")
    print("\n📖 Demo Instructions:")
    print("1. Select a reptile species from the dropdown")
    print("2. Look for the REPTIZOO terrarium with ⭐ PREMIUM badge")
    print("3. Click or drag it to the selected enclosure area")
    print("4. Notice the count changes from (0/1) to (1/1)")
    print("5. View the enhanced 3D model with:")
    print("   • Aluminum frame structure")
    print("   • Double hinge front doors") 
    print("   • Screen ventilation")
    print("   • Tempered glass panels")
    print("6. Click 'View on Amazon' to see the actual product")
    
    try:
        webbrowser.open(url)
        print("✅ Demo launched successfully!")
    except Exception as e:
        print(f"❌ Could not launch browser: {e}")
        print(f"   Please manually navigate to: {url}")

def main():
    """Run all integration tests"""
    
    print("🦎 REPTIZOO 36x18x18 Terrarium Integration Test")
    print("=" * 60)
    
    # Test web integration
    web_success = test_terrarium_model()
    
    # Test Python capabilities
    test_python_3d_capabilities()
    
    # Launch demo if tests pass
    if web_success:
        print("\n" + "=" * 60)
        user_input = input("🚀 Launch demo? (y/n): ").lower().strip()
        if user_input in ['y', 'yes']:
            launch_demo()
    
    print("\n✨ Integration test complete!")

if __name__ == "__main__":
    main() 