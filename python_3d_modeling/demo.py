#!/usr/bin/env python3
"""
Demo Script - REPTIZOO 36x18x18 Terrarium 3D Modeling
Tests all available Python 3D modeling approaches

Run this script to see which libraries work on your system
and compare the different approaches.
"""

import sys
import importlib
import time
from pathlib import Path

def check_library(library_name):
    """Check if a library is available"""
    try:
        importlib.import_module(library_name)
        return True
    except ImportError:
        return False

def print_header():
    """Print demo header"""
    print("\n" + "="*70)
    print("🐍 PYTHON 3D MODELING DEMO: REPTIZOO 36x18x18 TERRARIUM")
    print("="*70)
    print("Testing procedural modeling, rendering, and animation capabilities")
    print("Terrarium: 36\" × 18\" × 18\" (50 gallon) with hinged doors")
    print("Reference: https://www.amazon.com/REPTIZOO-Reptile-Terrarium-Ventilation-Knock-Down/dp/B07CV797LC")
    print()

def test_libraries():
    """Test which libraries are available"""
    libraries = {
        'matplotlib': 'Matplotlib 3D plotting',
        'numpy': 'NumPy arrays and math',
        'trimesh': 'Trimesh mesh processing',
        'open3d': 'Open3D 3D visualization',
        'vtk': 'VTK professional visualization',
        'pyvista': 'PyVista (VTK wrapper)',
        'scipy': 'SciPy scientific computing'
    }
    
    print("📦 CHECKING AVAILABLE LIBRARIES:")
    print("-" * 40)
    
    available = {}
    for lib, desc in libraries.items():
        is_available = check_library(lib)
        status = "✅ Available" if is_available else "❌ Not installed"
        print(f"{lib:12} | {status:15} | {desc}")
        available[lib] = is_available
    
    return available

def demo_matplotlib():
    """Demo Matplotlib 3D approach"""
    print("\n🎨 MATPLOTLIB 3D DEMONSTRATION:")
    print("-" * 40)
    
    try:
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import Axes3D
        from mpl_toolkits.mplot3d.art3d import Poly3DCollection
        import numpy as np
        
        print("Creating 3D visualization...")
        
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')
        
        # Terrarium dimensions (in meters)
        length, width, height = 0.9144, 0.4572, 0.4572
        
        # Create simple box frame
        def create_box_edges(l, w, h):
            """Create box edge lines"""
            vertices = np.array([
                [-l/2, -w/2, -h/2], [l/2, -w/2, -h/2],
                [l/2, w/2, -h/2], [-l/2, w/2, -h/2],
                [-l/2, -w/2, h/2], [l/2, -w/2, h/2],
                [l/2, w/2, h/2], [-l/2, w/2, h/2]
            ])
            
            # Define edges
            edges = [
                [0, 1], [1, 2], [2, 3], [3, 0],  # Bottom
                [4, 5], [5, 6], [6, 7], [7, 4],  # Top
                [0, 4], [1, 5], [2, 6], [3, 7]   # Vertical
            ]
            
            return vertices, edges
        
        vertices, edges = create_box_edges(length, width, height)
        
        # Plot edges
        for edge in edges:
            points = vertices[edge]
            ax.plot3D(points[:, 0], points[:, 1], points[:, 2], 'b-', linewidth=2)
        
        # Add glass panel representations
        glass_alpha = 0.3
        
        # Side panels
        side_verts = [vertices[[0, 1, 5, 4]], vertices[[2, 3, 7, 6]]]
        for verts in side_verts:
            ax.add_collection3d(Poly3DCollection([verts], alpha=glass_alpha, 
                                               facecolor='lightblue', edgecolor='blue'))
        
        # Back panel
        back_verts = vertices[[0, 3, 7, 4]]
        ax.add_collection3d(Poly3DCollection([back_verts], alpha=glass_alpha,
                                           facecolor='lightblue', edgecolor='blue'))
        
        # Bottom panel
        bottom_verts = vertices[[0, 1, 2, 3]]
        ax.add_collection3d(Poly3DCollection([bottom_verts], alpha=glass_alpha,
                                           facecolor='lightblue', edgecolor='blue'))
        
        # Set labels and title
        ax.set_xlabel('Length (m)')
        ax.set_ylabel('Width (m)')
        ax.set_zlabel('Height (m)')
        ax.set_title('REPTIZOO 36x18x18 Terrarium\n(Matplotlib 3D)', fontsize=14, fontweight='bold')
        
        # Set equal aspect ratio
        max_range = max(length, width, height) / 2
        ax.set_xlim([-max_range, max_range])
        ax.set_ylim([-max_range, max_range])
        ax.set_zlim([-max_range, max_range])
        
        print("✅ Matplotlib model created successfully!")
        print("📐 Dimensions: 36\" × 18\" × 18\" (0.91m × 0.46m × 0.46m)")
        print("🎨 Features: Glass panels, aluminum frame wireframe")
        
        # Save the plot
        plt.savefig('terrarium_matplotlib.png', dpi=300, bbox_inches='tight')
        print("💾 Saved as 'terrarium_matplotlib.png'")
        
        # Show plot (comment out if running headless)
        # plt.show()
        
        return True
        
    except Exception as e:
        print(f"❌ Matplotlib demo failed: {e}")
        return False

def demo_numpy_procedural():
    """Demo pure NumPy procedural generation"""
    print("\n🔢 NUMPY PROCEDURAL GENERATION:")
    print("-" * 40)
    
    try:
        import numpy as np
        
        print("Generating terrarium geometry with NumPy...")
        
        # Terrarium parameters
        length = 36  # inches
        width = 18   # inches  
        height = 18  # inches
        glass_thickness = 0.2  # inches
        frame_thickness = 0.75  # inches
        
        print(f"📐 Base dimensions: {length}\" × {width}\" × {height}\"")
        print(f"🔧 Frame thickness: {frame_thickness}\"")
        print(f"🪟 Glass thickness: {glass_thickness}\"")
        
        # Generate frame vertices procedurally
        def generate_frame_profile(length, thickness):
            """Generate rectangular frame profile"""
            half_thick = thickness / 2
            return np.array([
                [-length/2, -half_thick, -half_thick],
                [length/2, -half_thick, -half_thick],
                [length/2, half_thick, -half_thick],
                [-length/2, half_thick, -half_thick],
                [-length/2, -half_thick, half_thick],
                [length/2, -half_thick, half_thick],
                [length/2, half_thick, half_thick],
                [-length/2, half_thick, half_thick]
            ])
        
        # Generate all frame components
        components = {
            'bottom_long_frames': 2,
            'bottom_short_frames': 2, 
            'top_long_frames': 2,
            'top_short_frames': 2,
            'vertical_posts': 4,
            'glass_panels': 5,  # back, left, right, bottom, top_screen
            'front_doors': 2
        }
        
        total_vertices = 0
        for component, count in components.items():
            vertices_per_component = 8  # Each component is a box
            total_vertices += count * vertices_per_component
        
        print(f"🔨 Frame components: {sum(components.values())} pieces")
        print(f"📊 Total vertices: {total_vertices}")
        
        # Calculate glass panel areas
        glass_areas = {
            'back_panel': height * width,
            'side_panels': 2 * (height * length),
            'bottom_panel': length * width,
            'front_doors': 2 * (height * (length/2 - frame_thickness))
        }
        
        total_glass_area = sum(glass_areas.values())
        
        print(f"🪟 Glass panel areas (sq inches):")
        for panel, area in glass_areas.items():
            print(f"   {panel}: {area:.1f}")
        print(f"   Total glass area: {total_glass_area:.1f} sq inches")
        
        # Calculate frame volume
        frame_profiles = [
            ('bottom_long', length, 2),
            ('bottom_short', width, 2),
            ('top_long', length, 2), 
            ('top_short', width, 2),
            ('vertical_posts', height, 4)
        ]
        
        total_frame_volume = 0
        for name, length_dim, count in frame_profiles:
            volume = length_dim * frame_thickness * frame_thickness * count
            total_frame_volume += volume
            print(f"🔧 {name}: {volume:.2f} cubic inches ({count} pieces)")
        
        print(f"📦 Total frame volume: {total_frame_volume:.2f} cubic inches")
        
        # Generate procedural textures (UV coordinates)
        def generate_uv_mapping(width, height, resolution=10):
            """Generate UV coordinates for texture mapping"""
            u = np.linspace(0, 1, resolution)
            v = np.linspace(0, 1, resolution)
            return np.meshgrid(u, v)
        
        u_coords, v_coords = generate_uv_mapping(width, height)
        print(f"🎨 UV mapping generated: {u_coords.shape[0]}×{u_coords.shape[1]} resolution")
        
        print("✅ NumPy procedural generation completed!")
        print("🎯 All geometry calculated programmatically")
        
        return True
        
    except Exception as e:
        print(f"❌ NumPy demo failed: {e}")
        return False

def create_summary_report(available_libs, test_results):
    """Create a summary report"""
    print("\n📋 SUMMARY REPORT:")
    print("="*50)
    
    # Library availability
    available_count = sum(1 for available in available_libs.values() if available)
    total_count = len(available_libs)
    
    print(f"📦 Libraries: {available_count}/{total_count} available")
    
    # Test results
    successful_tests = sum(1 for result in test_results.values() if result)
    total_tests = len(test_results)
    
    print(f"🧪 Tests: {successful_tests}/{total_tests} successful")
    print()
    
    # Recommendations
    print("💡 RECOMMENDATIONS:")
    print("-" * 30)
    
    if available_libs.get('matplotlib', False):
        print("✅ Ready for basic 3D visualization with Matplotlib")
    
    if available_libs.get('trimesh', False):
        print("✅ Ready for mesh processing with Trimesh")
    
    if available_libs.get('open3d', False):
        print("✅ Ready for advanced 3D processing with Open3D")
        
    if available_libs.get('pyvista', False):
        print("✅ Ready for scientific visualization with PyVista")
    
    print("\n🎯 NEXT STEPS:")
    print("1. Install missing libraries: pip install -r requirements.txt")
    print("2. Try the Blender approach for full modeling capabilities")
    print("3. Export models for web integration with Three.js")
    print("4. Create animations and high-quality renders")
    
    print(f"\n🏆 CONCLUSION: Python is {'✅ EXCELLENT' if successful_tests >= 1 else '⚠️  LIMITED'} for 3D terrarium modeling!")

def main():
    """Run the complete demonstration"""
    start_time = time.time()
    
    print_header()
    
    # Check available libraries
    available_libs = test_libraries()
    
    # Run demonstrations
    test_results = {}
    
    if available_libs.get('matplotlib', False) and available_libs.get('numpy', False):
        test_results['matplotlib'] = demo_matplotlib()
    else:
        print("\n🎨 MATPLOTLIB: Skipped (matplotlib/numpy not available)")
        test_results['matplotlib'] = False
    
    if available_libs.get('numpy', False):
        test_results['numpy'] = demo_numpy_procedural()
    else:
        print("\n🔢 NUMPY: Skipped (numpy not available)")
        test_results['numpy'] = False
    
    # Create summary
    create_summary_report(available_libs, test_results)
    
    # Performance info
    end_time = time.time()
    print(f"\n⏱️  Demo completed in {end_time - start_time:.2f} seconds")
    print("="*70)

if __name__ == "__main__":
    main() 