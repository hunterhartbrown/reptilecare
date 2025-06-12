"""
Alternative Python 3D Modeling Approaches for Terrarium Creation
Demonstrates multiple libraries for procedural modeling without Blender
"""

# =============================================================================
# 1. Using Open3D - Great for mesh processing and visualization
# =============================================================================

import open3d as o3d
import numpy as np

def create_terrarium_open3d():
    """Create terrarium using Open3D library"""
    
    # Dimensions in meters
    length, width, height = 0.9144, 0.4572, 0.4572  # 36x18x18 inches
    glass_thickness = 0.005
    
    def create_glass_panel(w, h, d):
        """Create a glass panel mesh"""
        box = o3d.geometry.TriangleMesh.create_box(w, h, d)
        return box
    
    # Create frame structure
    frame_parts = []
    
    # Create glass panels
    glass_panels = []
    
    # Back panel
    back_panel = create_glass_panel(glass_thickness, width, height)
    back_panel.translate([-length/2, -width/2, -height/2])
    glass_panels.append(back_panel)
    
    # Side panels
    left_panel = create_glass_panel(length, glass_thickness, height)
    left_panel.translate([-length/2, -width/2, -height/2])
    glass_panels.append(left_panel)
    
    right_panel = create_glass_panel(length, glass_thickness, height)
    right_panel.translate([-length/2, width/2 - glass_thickness, -height/2])
    glass_panels.append(right_panel)
    
    # Bottom panel
    bottom_panel = create_glass_panel(length, width, glass_thickness)
    bottom_panel.translate([-length/2, -width/2, -height/2])
    glass_panels.append(bottom_panel)
    
    # Combine all panels  
    terrarium = glass_panels[0]
    for panel in glass_panels[1:]:
        terrarium += panel
    
    # Color the terrarium
    terrarium.paint_uniform_color([0.7, 0.9, 1.0])  # Light blue for glass
    
    return terrarium

# =============================================================================
# 2. Using Trimesh - Lightweight mesh processing
# =============================================================================

import trimesh

def create_terrarium_trimesh():
    """Create terrarium using Trimesh library"""
    
    # Dimensions
    length, width, height = 0.9144, 0.4572, 0.4572
    glass_thickness = 0.005
    
    # Create individual panels
    panels = []
    
    # Back panel
    back_panel = trimesh.creation.box(
        extents=[glass_thickness, width, height]
    )
    back_panel.apply_translation([-length/2 + glass_thickness/2, 0, 0])
    panels.append(back_panel)
    
    # Side panels
    left_panel = trimesh.creation.box(
        extents=[length, glass_thickness, height]
    )
    left_panel.apply_translation([0, -width/2 + glass_thickness/2, 0])
    panels.append(left_panel)
    
    right_panel = trimesh.creation.box(
        extents=[length, glass_thickness, height]
    )
    right_panel.apply_translation([0, width/2 - glass_thickness/2, 0])
    panels.append(right_panel)
    
    # Bottom panel
    bottom_panel = trimesh.creation.box(
        extents=[length, width, glass_thickness]
    )
    bottom_panel.apply_translation([0, 0, -height/2 + glass_thickness/2])
    panels.append(bottom_panel)
    
    # Front doors (separated for animation)
    door_width = length / 2 - 0.02  # Leave gap for frame
    
    left_door = trimesh.creation.box(
        extents=[door_width, glass_thickness, height - 0.04]
    )
    left_door.apply_translation([-door_width/2 - 0.01, width/2 - glass_thickness/2, 0])
    panels.append(left_door)
    
    right_door = trimesh.creation.box(
        extents=[door_width, glass_thickness, height - 0.04]
    )
    right_door.apply_translation([door_width/2 + 0.01, width/2 - glass_thickness/2, 0])
    panels.append(right_door)
    
    # Combine into single mesh
    terrarium = trimesh.util.concatenate(panels)
    
    # Set visual properties
    terrarium.visual.face_colors = [100, 150, 255, 100]  # Semi-transparent blue
    
    return terrarium

# =============================================================================
# 3. Using VTK - Professional visualization toolkit
# =============================================================================

import vtk

def create_terrarium_vtk():
    """Create terrarium using VTK library"""
    
    # Dimensions
    length, width, height = 0.9144, 0.4572, 0.4572
    
    # Create renderer
    renderer = vtk.vtkRenderer()
    renderer.SetBackground(0.9, 0.9, 1.0)
    
    def create_glass_panel(w, h, d, pos):
        """Create a glass panel using VTK"""
        # Create cube
        cube_source = vtk.vtkCubeSource()
        cube_source.SetXLength(w)
        cube_source.SetYLength(h) 
        cube_source.SetZLength(d)
        cube_source.SetCenter(pos[0], pos[1], pos[2])
        
        # Create mapper
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputConnection(cube_source.GetOutputPort())
        
        # Create actor
        actor = vtk.vtkActor()
        actor.SetMapper(mapper)
        
        # Set glass properties
        actor.GetProperty().SetColor(0.7, 0.9, 1.0)
        actor.GetProperty().SetOpacity(0.3)
        actor.GetProperty().SetSpecular(0.8)
        actor.GetProperty().SetSpecularPower(100)
        
        return actor
    
    # Create glass panels
    panels = []
    
    # Back panel
    back_panel = create_glass_panel(
        0.005, width, height, 
        [-length/2, 0, 0]
    )
    panels.append(back_panel)
    
    # Side panels
    left_panel = create_glass_panel(
        length, 0.005, height,
        [0, -width/2, 0]
    )
    panels.append(left_panel)
    
    right_panel = create_glass_panel(
        length, 0.005, height,
        [0, width/2, 0]
    )
    panels.append(right_panel)
    
    # Bottom panel
    bottom_panel = create_glass_panel(
        length, width, 0.005,
        [0, 0, -height/2]
    )
    panels.append(bottom_panel)
    
    # Add panels to renderer
    for panel in panels:
        renderer.AddActor(panel)
    
    return renderer, panels

# =============================================================================
# 4. Using Matplotlib (3D) - Good for simple visualizations
# =============================================================================

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

def create_terrarium_matplotlib():
    """Create terrarium visualization using Matplotlib"""
    
    fig = plt.figure(figsize=(12, 8))
    ax = fig.add_subplot(111, projection='3d')
    
    # Dimensions
    length, width, height = 0.9144, 0.4572, 0.4572
    
    def create_panel_vertices(w, h, d, center):
        """Create vertices for a rectangular panel"""
        x, y, z = center
        return [
            [x-w/2, y-h/2, z-d/2], [x+w/2, y-h/2, z-d/2],
            [x+w/2, y+h/2, z-d/2], [x-w/2, y+h/2, z-d/2],
            [x-w/2, y-h/2, z+d/2], [x+w/2, y-h/2, z+d/2],
            [x+w/2, y+h/2, z+d/2], [x-w/2, y+h/2, z+d/2]
        ]
    
    def create_panel_faces(vertices):
        """Create faces from vertices"""
        return [
            [vertices[0], vertices[1], vertices[5], vertices[4]],  # Front
            [vertices[2], vertices[3], vertices[7], vertices[6]],  # Back
            [vertices[1], vertices[2], vertices[6], vertices[5]],  # Right
            [vertices[4], vertices[7], vertices[3], vertices[0]],  # Left
            [vertices[3], vertices[2], vertices[1], vertices[0]],  # Bottom
            [vertices[4], vertices[5], vertices[6], vertices[7]]   # Top
        ]
    
    # Create glass panels
    panels_data = [
        (0.005, width, height, [-length/2, 0, 0]),      # Back
        (length, 0.005, height, [0, -width/2, 0]),      # Left
        (length, 0.005, height, [0, width/2, 0]),       # Right
        (length, width, 0.005, [0, 0, -height/2]),      # Bottom
    ]
    
    all_faces = []
    
    for w, h, d, center in panels_data:
        vertices = create_panel_vertices(w, h, d, center)
        faces = create_panel_faces(vertices)
        all_faces.extend(faces)
    
    # Create 3D collection
    glass_collection = Poly3DCollection(all_faces)
    glass_collection.set_alpha(0.3)
    glass_collection.set_facecolor('lightblue')
    glass_collection.set_edgecolor('black')
    
    ax.add_collection3d(glass_collection)
    
    # Set labels and limits
    ax.set_xlabel('Length (m)')
    ax.set_ylabel('Width (m)')  
    ax.set_zlabel('Height (m)')
    
    # Set equal aspect ratio
    max_range = max(length, width, height) / 2
    ax.set_xlim([-max_range, max_range])
    ax.set_ylim([-max_range, max_range])
    ax.set_zlim([-max_range, max_range])
    
    ax.set_title('REPTIZOO 36x18x18 Terrarium - Matplotlib 3D')
    
    return fig, ax

# =============================================================================
# 5. Using PyVista - High-level 3D visualization
# =============================================================================

try:
    import pyvista as pv
    
    def create_terrarium_pyvista():
        """Create terrarium using PyVista"""
        
        # Create plotter
        plotter = pv.Plotter()
        
        # Dimensions
        length, width, height = 0.9144, 0.4572, 0.4572
        glass_thickness = 0.005
        
        # Create glass panels
        panels = []
        
        # Back panel
        back_panel = pv.Cube(
            center=[-length/2, 0, 0],
            x_length=glass_thickness,
            y_length=width,
            z_length=height
        )
        panels.append(back_panel)
        
        # Side panels
        left_panel = pv.Cube(
            center=[0, -width/2, 0],
            x_length=length,
            y_length=glass_thickness,
            z_length=height
        )
        panels.append(left_panel)
        
        right_panel = pv.Cube(
            center=[0, width/2, 0],
            x_length=length,
            y_length=glass_thickness,
            z_length=height
        )
        panels.append(right_panel)
        
        # Bottom panel
        bottom_panel = pv.Cube(
            center=[0, 0, -height/2],
            x_length=length,
            y_length=width,
            z_length=glass_thickness
        )
        panels.append(bottom_panel)
        
        # Add panels to plotter with glass-like appearance
        for panel in panels:
            plotter.add_mesh(
                panel,
                color='lightblue',
                opacity=0.3,
                specular=0.8,
                specular_power=100
            )
        
        # Set camera position
        plotter.camera_position = [(2, -2, 1.5), (0, 0, 0), (0, 0, 1)]
        
        return plotter

except ImportError:
    def create_terrarium_pyvista():
        print("PyVista not installed. Run: pip install pyvista")
        return None

# =============================================================================
# Main execution and comparison
# =============================================================================

def main():
    """Demonstrate all approaches"""
    
    print("🐍 Python 3D Modeling for REPTIZOO 36x18x18 Terrarium")
    print("=" * 60)
    
    # 1. Open3D approach
    print("1️⃣  Creating model with Open3D...")
    try:
        terrarium_o3d = create_terrarium_open3d()
        print("✅ Open3D model created successfully")
        # o3d.visualization.draw_geometries([terrarium_o3d])  # Uncomment to view
    except Exception as e:
        print(f"❌ Open3D failed: {e}")
    
    # 2. Trimesh approach
    print("\n2️⃣  Creating model with Trimesh...")
    try:
        terrarium_trimesh = create_terrarium_trimesh()
        print("✅ Trimesh model created successfully")
        # terrarium_trimesh.show()  # Uncomment to view
    except Exception as e:
        print(f"❌ Trimesh failed: {e}")
    
    # 3. VTK approach
    print("\n3️⃣  Creating model with VTK...")
    try:
        renderer, panels = create_terrarium_vtk()
        print("✅ VTK model created successfully")
    except Exception as e:
        print(f"❌ VTK failed: {e}")
    
    # 4. Matplotlib approach
    print("\n4️⃣  Creating visualization with Matplotlib...")
    try:
        fig, ax = create_terrarium_matplotlib()
        print("✅ Matplotlib visualization created successfully")
        # plt.show()  # Uncomment to view
    except Exception as e:
        print(f"❌ Matplotlib failed: {e}")
    
    # 5. PyVista approach
    print("\n5️⃣  Creating model with PyVista...")
    try:
        plotter = create_terrarium_pyvista()
        if plotter:
            print("✅ PyVista model created successfully")
            # plotter.show()  # Uncomment to view
    except Exception as e:
        print(f"❌ PyVista failed: {e}")
    
    print("\n" + "=" * 60)
    print("📊 COMPARISON SUMMARY:")
    print("• Blender (bpy): Most comprehensive - modeling, animation, rendering")
    print("• Open3D: Best for mesh processing and scientific visualization")
    print("• Trimesh: Lightweight, good for geometric operations")
    print("• VTK: Professional visualization, great for scientific apps")
    print("• Matplotlib: Simple visualization, good for basic 3D plots")
    print("• PyVista: High-level VTK wrapper, user-friendly")

if __name__ == "__main__":
    main() 