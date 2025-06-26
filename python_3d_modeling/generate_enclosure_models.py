#!/usr/bin/env python3
"""
Pre-generate Optimized 3D Enclosure Models
This script generates lightweight 3D models for different enclosure types and saves them
as web-compatible files (GLB/GLTF format) to eliminate real-time rendering lag.
"""

import json
import numpy as np
from pathlib import Path
import sys

# Add the parent directory to the path so we can import other modules
sys.path.append(str(Path(__file__).parent))

try:
    import trimesh
    TRIMESH_AVAILABLE = True
except ImportError:
    print("Warning: trimesh not available. Install with: pip install trimesh")
    TRIMESH_AVAILABLE = False

class EnclosureModelGenerator:
    def __init__(self, output_dir="../models"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Standard enclosure configurations
        self.enclosure_configs = {
            "reptizoo_36x18x18": {
                "dimensions": [36, 18, 18],  # inches
                "type": "reptizoo",
                "description": "REPTIZOO 36x18x18 Glass Terrarium"
            },
            "reptizoo_24x18x36": {
                "dimensions": [24, 18, 36],
                "type": "reptizoo", 
                "description": "REPTIZOO 24x18x36 Tall Glass Terrarium"
            },
            "reptizoo_40gal_36x16x18": {
                "dimensions": [36, 16, 18],
                "type": "reptizoo",
                "description": "REPTIZOO 40 Gallon Breeder"
            },
            "pvc_36x18x18": {
                "dimensions": [36, 18, 18],
                "type": "pvc",
                "description": "PVC Panel Enclosure 36x18x18"
            },
            "pvc_48x24x24": {
                "dimensions": [48, 24, 24],
                "type": "pvc", 
                "description": "PVC Panel Enclosure 48x24x24"
            },
            "basic_40gal_breeder": {
                "dimensions": [36, 18, 16],
                "type": "basic",
                "description": "40 Gallon Breeder Tank"
            },
            "basic_75gal": {
                "dimensions": [48, 18, 21],
                "type": "basic",
                "description": "75 Gallon Long Tank"
            }
        }
        
    def inches_to_meters(self, inches):
        """Convert inches to meters"""
        return inches * 0.0254
        
    def create_reptizoo_model(self, length, width, height):
        """Create REPTIZOO style terrarium model matching the real product appearance"""
        if not TRIMESH_AVAILABLE:
            return self.create_simple_model(length, width, height)
            
        # Convert to meters
        l, w, h = self.inches_to_meters(length), self.inches_to_meters(width), self.inches_to_meters(height)
        
        meshes = []
        
        # More accurate frame dimensions
        frame_thick = 0.015  # 15mm aluminum frame (more realistic)
        glass_thick = 0.005  # 5mm tempered glass
        
        # Detailed aluminum frame structure - black anodized aluminum
        frame_material = [0.15, 0.15, 0.15, 1.0]  # Dark charcoal/black frame like real REPTIZOO
        
        # === DETAILED FRAME CONSTRUCTION ===
        
        # Bottom frame rails (4 pieces forming rectangle)
        bottom_long_front = trimesh.creation.box(extents=[l, frame_thick, frame_thick])
        bottom_long_front.visual.face_colors = frame_material
        bottom_long_front.apply_translation([0, w/2 - frame_thick/2, -h/2 + frame_thick/2])
        meshes.append(bottom_long_front)
        
        bottom_long_back = trimesh.creation.box(extents=[l, frame_thick, frame_thick])
        bottom_long_back.visual.face_colors = frame_material
        bottom_long_back.apply_translation([0, -w/2 + frame_thick/2, -h/2 + frame_thick/2])
        meshes.append(bottom_long_back)
        
        bottom_short_left = trimesh.creation.box(extents=[frame_thick, w - 2*frame_thick, frame_thick])
        bottom_short_left.visual.face_colors = frame_material
        bottom_short_left.apply_translation([-l/2 + frame_thick/2, 0, -h/2 + frame_thick/2])
        meshes.append(bottom_short_left)
        
        bottom_short_right = trimesh.creation.box(extents=[frame_thick, w - 2*frame_thick, frame_thick])
        bottom_short_right.visual.face_colors = frame_material
        bottom_short_right.apply_translation([l/2 - frame_thick/2, 0, -h/2 + frame_thick/2])
        meshes.append(bottom_short_right)
        
        # Top frame rails (identical to bottom)
        top_long_front = trimesh.creation.box(extents=[l, frame_thick, frame_thick])
        top_long_front.visual.face_colors = frame_material
        top_long_front.apply_translation([0, w/2 - frame_thick/2, h/2 - frame_thick/2])
        meshes.append(top_long_front)
        
        top_long_back = trimesh.creation.box(extents=[l, frame_thick, frame_thick])
        top_long_back.visual.face_colors = frame_material
        top_long_back.apply_translation([0, -w/2 + frame_thick/2, h/2 - frame_thick/2])
        meshes.append(top_long_back)
        
        top_short_left = trimesh.creation.box(extents=[frame_thick, w - 2*frame_thick, frame_thick])
        top_short_left.visual.face_colors = frame_material
        top_short_left.apply_translation([-l/2 + frame_thick/2, 0, h/2 - frame_thick/2])
        meshes.append(top_short_left)
        
        top_short_right = trimesh.creation.box(extents=[frame_thick, w - 2*frame_thick, frame_thick])
        top_short_right.visual.face_colors = frame_material
        top_short_right.apply_translation([l/2 - frame_thick/2, 0, h/2 - frame_thick/2])
        meshes.append(top_short_right)
        
        # Vertical corner posts (4 corners)
        vertical_post = trimesh.creation.box(extents=[frame_thick, frame_thick, h - 2*frame_thick])
        vertical_post.visual.face_colors = frame_material
        
        # Four corner posts
        corner_positions = [
            [-l/2 + frame_thick/2, -w/2 + frame_thick/2, 0],  # Back left
            [l/2 - frame_thick/2, -w/2 + frame_thick/2, 0],   # Back right
            [-l/2 + frame_thick/2, w/2 - frame_thick/2, 0],   # Front left
            [l/2 - frame_thick/2, w/2 - frame_thick/2, 0]     # Front right
        ]
        
        for pos in corner_positions:
            post = vertical_post.copy()
            post.apply_translation(pos)
            meshes.append(post)
        
        # === GLASS PANELS ===
        # Crystal clear glass with slight blue tint like real terrariums
        glass_material = [0.95, 0.98, 1.0, 0.15]  # Very light blue tint, high transparency
        
        # Back panel - full back wall
        back_glass = trimesh.creation.box(extents=[glass_thick, l - 2*frame_thick, h - 2*frame_thick])
        back_glass.visual.face_colors = glass_material
        back_glass.apply_translation([-w/2 + glass_thick/2, 0, 0])
        meshes.append(back_glass)
        
        # Side panels - left and right walls
        side_glass_left = trimesh.creation.box(extents=[w - 2*frame_thick, glass_thick, h - 2*frame_thick])
        side_glass_left.visual.face_colors = glass_material
        side_glass_left.apply_translation([0, -l/2 + glass_thick/2, 0])
        meshes.append(side_glass_left)
        
        side_glass_right = trimesh.creation.box(extents=[w - 2*frame_thick, glass_thick, h - 2*frame_thick])
        side_glass_right.visual.face_colors = glass_material
        side_glass_right.apply_translation([0, l/2 - glass_thick/2, 0])
        meshes.append(side_glass_right)
        
        # Bottom glass panel
        bottom_glass = trimesh.creation.box(extents=[l - 2*frame_thick, w - 2*frame_thick, glass_thick])
        bottom_glass.visual.face_colors = glass_material
        bottom_glass.apply_translation([0, 0, -h/2 + frame_thick + glass_thick/2])
        meshes.append(bottom_glass)
        
        # === FRONT DOORS (DISTINCTIVE REPTIZOO FEATURE) ===
        # REPTIZOO has characteristic double front doors
        door_width = (l - 3*frame_thick) / 2  # Two doors split by center frame
        door_height = h - 2*frame_thick
        
        # Center divider post (between doors)
        center_post = trimesh.creation.box(extents=[frame_thick, frame_thick, door_height])
        center_post.visual.face_colors = frame_material
        center_post.apply_translation([0, w/2 - frame_thick/2, 0])
        meshes.append(center_post)
        
        # Left door glass
        left_door_glass = trimesh.creation.box(extents=[door_width - frame_thick, glass_thick, door_height])
        left_door_glass.visual.face_colors = glass_material
        left_door_glass.apply_translation([-(door_width + frame_thick)/2, w/2 - glass_thick/2, 0])
        meshes.append(left_door_glass)
        
        # Right door glass  
        right_door_glass = trimesh.creation.box(extents=[door_width - frame_thick, glass_thick, door_height])
        right_door_glass.visual.face_colors = glass_material
        right_door_glass.apply_translation([(door_width + frame_thick)/2, w/2 - glass_thick/2, 0])
        meshes.append(right_door_glass)
        
        # Door frames (thin aluminum frames around glass doors)
        door_frame_thickness = 0.008  # 8mm door frame
        door_frame_material = [0.12, 0.12, 0.12, 1.0]  # Slightly darker frame for doors
        
        # Left door frame (4 pieces)
        left_door_frame_pieces = [
            # Top
            ([-(door_width)/2, w/2 - door_frame_thickness/2, door_height/2 - door_frame_thickness/2], 
             [door_width, door_frame_thickness, door_frame_thickness]),
            # Bottom  
            ([-(door_width)/2, w/2 - door_frame_thickness/2, -door_height/2 + door_frame_thickness/2],
             [door_width, door_frame_thickness, door_frame_thickness]),
            # Left side
            ([-door_width + door_frame_thickness/2, w/2 - door_frame_thickness/2, 0],
             [door_frame_thickness, door_frame_thickness, door_height - 2*door_frame_thickness]),
            # Right side (center)
            ([-door_frame_thickness/2, w/2 - door_frame_thickness/2, 0],
             [door_frame_thickness, door_frame_thickness, door_height - 2*door_frame_thickness])
        ]
        
        for pos, extents in left_door_frame_pieces:
            frame_piece = trimesh.creation.box(extents=extents)
            frame_piece.visual.face_colors = door_frame_material
            frame_piece.apply_translation(pos)
            meshes.append(frame_piece)
        
        # Right door frame (mirror of left)
        right_door_frame_pieces = [
            # Top
            ([door_width/2, w/2 - door_frame_thickness/2, door_height/2 - door_frame_thickness/2], 
             [door_width, door_frame_thickness, door_frame_thickness]),
            # Bottom  
            ([door_width/2, w/2 - door_frame_thickness/2, -door_height/2 + door_frame_thickness/2],
             [door_width, door_frame_thickness, door_frame_thickness]),
            # Left side (center)
            ([door_frame_thickness/2, w/2 - door_frame_thickness/2, 0],
             [door_frame_thickness, door_frame_thickness, door_height - 2*door_frame_thickness]),
            # Right side
            ([door_width - door_frame_thickness/2, w/2 - door_frame_thickness/2, 0],
             [door_frame_thickness, door_frame_thickness, door_height - 2*door_frame_thickness])
        ]
        
        for pos, extents in right_door_frame_pieces:
            frame_piece = trimesh.creation.box(extents=extents)
            frame_piece.visual.face_colors = door_frame_material
            frame_piece.apply_translation(pos)
            meshes.append(frame_piece)
        
        # === SCREEN VENTILATION TOP (DISTINCTIVE FEATURE) ===
        # REPTIZOO has fine mesh screen on top for ventilation
        screen_material = [0.1, 0.1, 0.1, 0.7]  # Dark mesh material
        
        # Main screen panel
        screen_top = trimesh.creation.box(extents=[l - 2*frame_thick, w - 2*frame_thick, 0.002])
        screen_top.visual.face_colors = screen_material
        screen_top.apply_translation([0, 0, h/2 - 0.001])
        meshes.append(screen_top)
        
        # Screen frame (holds the mesh)
        screen_frame_thick = 0.005  # 5mm screen frame
        screen_frame_material = [0.08, 0.08, 0.08, 1.0]  # Very dark frame for screen
        
        # Screen frame pieces (4 sides)
        screen_frame_pieces = [
            # Front
            ([0, w/2 - frame_thick - screen_frame_thick/2, h/2 - screen_frame_thick/2],
             [l - 2*frame_thick, screen_frame_thick, screen_frame_thick]),
            # Back
            ([0, -w/2 + frame_thick + screen_frame_thick/2, h/2 - screen_frame_thick/2],
             [l - 2*frame_thick, screen_frame_thick, screen_frame_thick]),
            # Left
            ([-l/2 + frame_thick + screen_frame_thick/2, 0, h/2 - screen_frame_thick/2],
             [screen_frame_thick, w - 2*frame_thick, screen_frame_thick]),
            # Right
            ([l/2 - frame_thick - screen_frame_thick/2, 0, h/2 - screen_frame_thick/2],
             [screen_frame_thick, w - 2*frame_thick, screen_frame_thick])
        ]
        
        for pos, extents in screen_frame_pieces:
            frame_piece = trimesh.creation.box(extents=extents)
            frame_piece.visual.face_colors = screen_frame_material
            frame_piece.apply_translation(pos)
            meshes.append(frame_piece)
        
        # === DOOR HANDLES ===
        # Small but visible door handles for realism
        handle_material = [0.05, 0.05, 0.05, 1.0]  # Very dark handles
        
        # Left door handle
        left_handle = trimesh.creation.cylinder(radius=0.004, height=0.015)
        left_handle.visual.face_colors = handle_material
        # Rotate to be horizontal and position on door
        left_handle.apply_transform(trimesh.transformations.rotation_matrix(
            np.pi/2, [0, 0, 1]))  # Rotate 90 degrees around Z
        left_handle.apply_translation([-door_width/3, w/2 + 0.008, 0])
        meshes.append(left_handle)
        
        # Right door handle
        right_handle = trimesh.creation.cylinder(radius=0.004, height=0.015)
        right_handle.visual.face_colors = handle_material
        right_handle.apply_transform(trimesh.transformations.rotation_matrix(
            np.pi/2, [0, 0, 1]))
        right_handle.apply_translation([door_width/3, w/2 + 0.008, 0])
        meshes.append(right_handle)
        
        # === SUBSTRATE TRAY (BOTTOM FEATURE) ===
        # REPTIZOO often includes a removable substrate tray
        tray_material = [0.2, 0.2, 0.2, 1.0]  # Dark gray tray
        tray_thickness = 0.003  # 3mm tray
        
        substrate_tray = trimesh.creation.box(extents=[
            l - 2*frame_thick - 0.01,  # Slightly smaller than interior
            w - 2*frame_thick - 0.01, 
            tray_thickness
        ])
        substrate_tray.visual.face_colors = tray_material
        substrate_tray.apply_translation([0, 0, -h/2 + frame_thick + glass_thick + tray_thickness/2])
        meshes.append(substrate_tray)
        
        # === BRANDING ELEMENT ===
        # Small REPTIZOO logo area (simplified as small dark rectangle)
        logo_material = [0.0, 0.0, 0.0, 1.0]  # Black logo area
        
        logo_plate = trimesh.creation.box(extents=[0.06, 0.02, 0.001])  # Small logo plate
        logo_plate.visual.face_colors = logo_material
        logo_plate.apply_translation([l/2 - 0.08, w/2 - 0.01, -h/2 + frame_thick/2])
        meshes.append(logo_plate)
        
        # Combine all meshes
        combined = trimesh.util.concatenate(meshes)
        return combined
        
    def create_pvc_model(self, length, width, height):
        """Create PVC panel enclosure model"""
        if not TRIMESH_AVAILABLE:
            return self.create_simple_model(length, width, height)
            
        # Convert to meters  
        l, w, h = self.inches_to_meters(length), self.inches_to_meters(width), self.inches_to_meters(height)
        
        meshes = []
        panel_thick = 0.012  # 12mm PVC thickness
        pvc_material = [0.9, 0.9, 0.85, 1.0]  # Off-white PVC color
        
        # Back panel
        back_panel = trimesh.creation.box(extents=[panel_thick, w, h])
        back_panel.visual.face_colors = pvc_material
        back_panel.apply_translation([-l/2 + panel_thick/2, 0, 0])
        meshes.append(back_panel)
        
        # Side panels
        side_panel = trimesh.creation.box(extents=[l, panel_thick, h])
        side_panel.visual.face_colors = pvc_material
        
        left_panel = side_panel.copy()
        left_panel.apply_translation([0, -w/2 + panel_thick/2, 0])
        meshes.append(left_panel)
        
        right_panel = side_panel.copy()
        right_panel.apply_translation([0, w/2 - panel_thick/2, 0])
        meshes.append(right_panel)
        
        # Bottom panel
        bottom_panel = trimesh.creation.box(extents=[l, w, panel_thick])
        bottom_panel.visual.face_colors = pvc_material
        bottom_panel.apply_translation([0, 0, -h/2 + panel_thick/2])
        meshes.append(bottom_panel)
        
        # Top panel with ventilation holes (simplified as solid for now)
        top_panel = trimesh.creation.box(extents=[l, w, panel_thick])
        top_panel.visual.face_colors = pvc_material
        top_panel.apply_translation([0, 0, h/2 - panel_thick/2])
        meshes.append(top_panel)
        
        # Combine all meshes
        combined = trimesh.util.concatenate(meshes)
        return combined
        
    def create_basic_model(self, length, width, height):
        """Create basic glass tank model"""
        if not TRIMESH_AVAILABLE:
            return self.create_simple_model(length, width, height)
            
        # Convert to meters
        l, w, h = self.inches_to_meters(length), self.inches_to_meters(width), self.inches_to_meters(height)
        
        meshes = []
        glass_thick = 0.006  # 6mm glass thickness
        glass_material = [0.85, 0.9, 0.95, 0.4]  # Light glass tint
        
        # All panels
        panels = [
            # Back panel
            ([-l/2 + glass_thick/2, 0, 0], [glass_thick, w, h]),
            # Side panels  
            ([0, -w/2 + glass_thick/2, 0], [l, glass_thick, h]),
            ([0, w/2 - glass_thick/2, 0], [l, glass_thick, h]),
            # Bottom panel
            ([0, 0, -h/2 + glass_thick/2], [l, w, glass_thick])
        ]
        
        for position, extents in panels:
            panel = trimesh.creation.box(extents=extents)
            panel.visual.face_colors = glass_material
            panel.apply_translation(position)
            meshes.append(panel)
            
        # Combine all meshes
        combined = trimesh.util.concatenate(meshes)
        return combined
        
    def create_simple_model(self, length, width, height):
        """Fallback simple model when trimesh is not available"""
        # Create simple wireframe data structure
        l, w, h = self.inches_to_meters(length), self.inches_to_meters(width), self.inches_to_meters(height)
        
        # Define vertices of a box
        vertices = [
            [-l/2, -w/2, -h/2], [l/2, -w/2, -h/2], [l/2, w/2, -h/2], [-l/2, w/2, -h/2],  # Bottom
            [-l/2, -w/2, h/2], [l/2, -w/2, h/2], [l/2, w/2, h/2], [-l/2, w/2, h/2]      # Top
        ]
        
        # Define faces (triangles)
        faces = [
            # Bottom face
            [0, 1, 2], [0, 2, 3],
            # Top face  
            [4, 6, 5], [4, 7, 6],
            # Side faces
            [0, 4, 5], [0, 5, 1],  # Front
            [2, 6, 7], [2, 7, 3],  # Back
            [1, 5, 6], [1, 6, 2],  # Right
            [0, 3, 7], [0, 7, 4]   # Left
        ]
        
        return {
            'vertices': vertices,
            'faces': faces,
            'type': 'simple',
            'dimensions': [length, width, height]
        }
        
    def generate_all_models(self):
        """Generate all enclosure models"""
        print("🏗️  Generating optimized 3D enclosure models...")
        
        generated_models = {}
        
        for config_name, config in self.enclosure_configs.items():
            print(f"  📦 Generating {config_name}...")
            
            length, width, height = config["dimensions"]
            enclosure_type = config["type"]
            
            # Generate the appropriate model
            if enclosure_type == "reptizoo":
                model = self.create_reptizoo_model(length, width, height)
            elif enclosure_type == "pvc":
                model = self.create_pvc_model(length, width, height)
            else:  # basic
                model = self.create_basic_model(length, width, height)
                
            # Save the model
            if TRIMESH_AVAILABLE and hasattr(model, 'export'):
                # Save as GLB (binary GLTF) for web compatibility
                output_path = self.output_dir / f"{config_name}.glb"
                model.export(str(output_path))
                print(f"    ✅ Saved {output_path}")
                
                # Also save as JSON for metadata
                metadata = {
                    'name': config_name,
                    'description': config['description'],
                    'dimensions': config['dimensions'],
                    'type': config['type'],
                    'file': f"{config_name}.glb",
                    'vertices': len(model.vertices) if hasattr(model, 'vertices') else 0,
                    'faces': len(model.faces) if hasattr(model, 'faces') else 0
                }
            else:
                # Save as JSON for simple models
                output_path = self.output_dir / f"{config_name}.json"
                metadata = {
                    'name': config_name,
                    'description': config['description'],
                    'dimensions': config['dimensions'],
                    'type': config['type'],
                    'file': f"{config_name}.json",
                    'model_data': model
                }
                
                with open(output_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                print(f"    ✅ Saved {output_path}")
                
            generated_models[config_name] = metadata
            
        # Save model registry
        registry_path = self.output_dir / "model_registry.json"
        with open(registry_path, 'w') as f:
            json.dump({
                'models': generated_models,
                'generated_at': str(Path(__file__).stat().st_mtime),
                'description': 'Pre-generated 3D enclosure models for web loading'
            }, f, indent=2)
            
        print(f"📋 Model registry saved to {registry_path}")
        print(f"🎉 Generated {len(generated_models)} enclosure models!")
        
        return generated_models

def main():
    """Main function to generate all models"""
    print("🐍 3D Enclosure Model Generator")
    print("=" * 50)
    
    generator = EnclosureModelGenerator()
    models = generator.generate_all_models()
    
    print("\n📊 Generation Summary:")
    print(f"  • Models generated: {len(models)}")
    print(f"  • Output directory: {generator.output_dir}")
    print(f"  • Trimesh available: {TRIMESH_AVAILABLE}")
    if not TRIMESH_AVAILABLE:
        print("  💡 Install trimesh for GLB export: pip install trimesh[easy]")
    
    return models

if __name__ == "__main__":
    main() 