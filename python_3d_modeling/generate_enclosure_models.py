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
        """Create REPTIZOO style terrarium model"""
        if not TRIMESH_AVAILABLE:
            return self.create_simple_model(length, width, height)
            
        # Convert to meters
        l, w, h = self.inches_to_meters(length), self.inches_to_meters(width), self.inches_to_meters(height)
        
        # Create components
        meshes = []
        
        # Frame thickness
        frame_thick = 0.01  # 1cm
        glass_thick = 0.003  # 3mm
        
        # Create aluminum frame structure
        frame_material = [0.7, 0.7, 0.75, 1.0]  # Aluminum color
        
        # Bottom frame rails (4 pieces)
        bottom_long = trimesh.creation.box(extents=[l, frame_thick, frame_thick])
        bottom_long.visual.face_colors = frame_material
        
        # Position bottom rails
        for y_pos in [-w/2 + frame_thick/2, w/2 - frame_thick/2]:
            frame_copy = bottom_long.copy()
            frame_copy.apply_translation([0, y_pos, -h/2 + frame_thick/2])
            meshes.append(frame_copy)
            
        bottom_short = trimesh.creation.box(extents=[frame_thick, w, frame_thick])
        bottom_short.visual.face_colors = frame_material
        
        for x_pos in [-l/2 + frame_thick/2, l/2 - frame_thick/2]:
            frame_copy = bottom_short.copy()
            frame_copy.apply_translation([x_pos, 0, -h/2 + frame_thick/2])
            meshes.append(frame_copy)
            
        # Top frame (identical to bottom)
        for y_pos in [-w/2 + frame_thick/2, w/2 - frame_thick/2]:
            frame_copy = bottom_long.copy()
            frame_copy.apply_translation([0, y_pos, h/2 - frame_thick/2])
            meshes.append(frame_copy)
            
        for x_pos in [-l/2 + frame_thick/2, l/2 - frame_thick/2]:
            frame_copy = bottom_short.copy()
            frame_copy.apply_translation([x_pos, 0, h/2 - frame_thick/2])
            meshes.append(frame_copy)
            
        # Vertical corner posts
        vertical_post = trimesh.creation.box(extents=[frame_thick, frame_thick, h])
        vertical_post.visual.face_colors = frame_material
        
        for x_pos in [-l/2 + frame_thick/2, l/2 - frame_thick/2]:
            for y_pos in [-w/2 + frame_thick/2, w/2 - frame_thick/2]:
                post_copy = vertical_post.copy()
                post_copy.apply_translation([x_pos, y_pos, 0])
                meshes.append(post_copy)
                
        # Glass panels
        glass_material = [0.9, 0.95, 1.0, 0.3]  # Light blue tinted glass
        
        # Back panel
        back_glass = trimesh.creation.box(extents=[glass_thick, w - 2*frame_thick, h - 2*frame_thick])
        back_glass.visual.face_colors = glass_material
        back_glass.apply_translation([-l/2 + glass_thick/2, 0, 0])
        meshes.append(back_glass)
        
        # Side panels
        side_glass = trimesh.creation.box(extents=[l - 2*frame_thick, glass_thick, h - 2*frame_thick])
        side_glass.visual.face_colors = glass_material
        
        left_glass = side_glass.copy()
        left_glass.apply_translation([0, -w/2 + glass_thick/2, 0])
        meshes.append(left_glass)
        
        right_glass = side_glass.copy()
        right_glass.apply_translation([0, w/2 - glass_thick/2, 0])
        meshes.append(right_glass)
        
        # Bottom panel
        bottom_glass = trimesh.creation.box(extents=[l - 2*frame_thick, w - 2*frame_thick, glass_thick])
        bottom_glass.visual.face_colors = glass_material
        bottom_glass.apply_translation([0, 0, -h/2 + glass_thick/2])
        meshes.append(bottom_glass)
        
        # Top screen (ventilation)
        screen_material = [0.2, 0.2, 0.2, 0.8]
        top_screen = trimesh.creation.box(extents=[l - 2*frame_thick, w - 2*frame_thick, 0.001])
        top_screen.visual.face_colors = screen_material
        top_screen.apply_translation([0, 0, h/2 - 0.0005])
        meshes.append(top_screen)
        
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