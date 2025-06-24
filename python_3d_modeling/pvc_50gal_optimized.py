#!/usr/bin/env python3
"""
Optimized PVC 50 Gallon Enclosure Generator for Web
Creates a lightweight, web-optimized model of the PVC enclosure with blacked out sides
Designed for export as .glb for fast web loading

Run this script within Blender to generate the model
"""

import bpy
import bmesh
from mathutils import Vector
import os

class PVC50GalOptimized:
    def __init__(self):
        # PVC 50 gallon dimensions: 36" x 18" x 18"
        self.INCH_TO_METER = 0.0254
        self.LENGTH = 36 * self.INCH_TO_METER  # 0.9144m
        self.WIDTH = 18 * self.INCH_TO_METER   # 0.4572m
        self.HEIGHT = 18 * self.INCH_TO_METER  # 0.4572m
        
        # Material thickness
        self.PANEL_THICKNESS = 0.008  # 8mm PVC panels
        self.FRAME_THICKNESS = 0.015  # 15mm aluminum frame
        
        # Clear the scene
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)
        
    def create_optimized_materials(self):
        """Create web-optimized materials with reduced complexity"""
        materials = {}
        
        # Black PVC Material (simplified for web)
        pvc_mat = bpy.data.materials.new(name="PVC_Black")
        pvc_mat.use_nodes = True
        nodes = pvc_mat.node_tree.nodes
        nodes.clear()
        
        # Simple principled BSDF for PVC
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1.0)  # Dark gray/black
        bsdf.inputs['Roughness'].default_value = 0.3
        bsdf.inputs['Metallic'].default_value = 0.0
        
        output = nodes.new(type='ShaderNodeOutputMaterial')
        pvc_mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
        materials['pvc'] = pvc_mat
        
        # Aluminum Frame Material (simplified)
        aluminum_mat = bpy.data.materials.new(name="Aluminum_Frame")
        aluminum_mat.use_nodes = True
        nodes = aluminum_mat.node_tree.nodes
        nodes.clear()
        
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.7, 0.7, 0.7, 1.0)  # Light gray
        bsdf.inputs['Roughness'].default_value = 0.1
        bsdf.inputs['Metallic'].default_value = 0.8
        
        output = nodes.new(type='ShaderNodeOutputMaterial')
        aluminum_mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
        materials['aluminum'] = aluminum_mat
        
        # Acrylic Front (optimized transparency)
        acrylic_mat = bpy.data.materials.new(name="Acrylic_Front")
        acrylic_mat.use_nodes = True
        nodes = acrylic_mat.node_tree.nodes
        nodes.clear()
        
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
        bsdf.inputs['Alpha'].default_value = 0.4  # Semi-transparent
        bsdf.inputs['Transmission'].default_value = 0.8
        bsdf.inputs['Roughness'].default_value = 0.0
        
        output = nodes.new(type='ShaderNodeOutputMaterial')
        acrylic_mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
        acrylic_mat.blend_method = 'BLEND'
        materials['acrylic'] = acrylic_mat
        
        # Mesh Screen Material (optimized)
        mesh_mat = bpy.data.materials.new(name="Mesh_Screen")
        mesh_mat.use_nodes = True
        nodes = mesh_mat.node_tree.nodes
        nodes.clear()
        
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.2, 0.2, 0.2, 1.0)
        bsdf.inputs['Alpha'].default_value = 0.7
        bsdf.inputs['Roughness'].default_value = 0.8
        
        output = nodes.new(type='ShaderNodeOutputMaterial')
        mesh_mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
        mesh_mat.blend_method = 'BLEND'
        materials['mesh'] = mesh_mat
        
        return materials
    
    def create_optimized_frame(self, materials):
        """Create simplified aluminum frame structure"""
        # Create frame using bmesh for efficiency
        bm = bmesh.new()
        
        # Create corner posts only (8 total)
        corner_positions = [
            # Bottom corners
            (-self.LENGTH/2, -self.HEIGHT/2, -self.WIDTH/2),
            (self.LENGTH/2, -self.HEIGHT/2, -self.WIDTH/2),
            (-self.LENGTH/2, -self.HEIGHT/2, self.WIDTH/2),
            (self.LENGTH/2, -self.HEIGHT/2, self.WIDTH/2),
            # Top corners
            (-self.LENGTH/2, self.HEIGHT/2, -self.WIDTH/2),
            (self.LENGTH/2, self.HEIGHT/2, -self.WIDTH/2),
            (-self.LENGTH/2, self.HEIGHT/2, self.WIDTH/2),
            (self.LENGTH/2, self.HEIGHT/2, self.WIDTH/2),
        ]
        
        # Create simplified corner posts
        for i, pos in enumerate(corner_positions):
            bmesh.ops.create_cube(bm, size=self.FRAME_THICKNESS)
            # Move the last created vertices to position
            for vert in bm.verts[-8:]:
                vert.co += Vector(pos)
        
        # Create mesh object
        frame_mesh = bpy.data.meshes.new("PVC_Frame")
        bm.to_mesh(frame_mesh)
        bm.free()
        
        frame_obj = bpy.data.objects.new("PVC_Frame", frame_mesh)
        bpy.context.collection.objects.link(frame_obj)
        frame_obj.data.materials.append(materials['aluminum'])
        
        return frame_obj
    
    def create_pvc_panels(self, materials):
        """Create optimized PVC panels"""
        panels = []
        
        # Back panel (full black PVC)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(0, 0, -self.WIDTH/2)
        )
        back_panel = bpy.context.active_object
        back_panel.name = "PVC_Back_Panel"
        back_panel.scale = (self.LENGTH - 2*self.FRAME_THICKNESS, 
                           self.HEIGHT - 2*self.FRAME_THICKNESS, 
                           self.PANEL_THICKNESS)
        bpy.ops.object.transform_apply(transform_type='SCALE')
        back_panel.data.materials.append(materials['pvc'])
        panels.append(back_panel)
        
        # Left panel (black PVC)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(-self.LENGTH/2, 0, 0)
        )
        left_panel = bpy.context.active_object
        left_panel.name = "PVC_Left_Panel"
        left_panel.scale = (self.PANEL_THICKNESS,
                           self.HEIGHT - 2*self.FRAME_THICKNESS,
                           self.WIDTH - 2*self.FRAME_THICKNESS)
        bpy.ops.object.transform_apply(transform_type='SCALE')
        left_panel.data.materials.append(materials['pvc'])
        panels.append(left_panel)
        
        # Right panel (black PVC)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(self.LENGTH/2, 0, 0)
        )
        right_panel = bpy.context.active_object
        right_panel.name = "PVC_Right_Panel"
        right_panel.scale = (self.PANEL_THICKNESS,
                            self.HEIGHT - 2*self.FRAME_THICKNESS,
                            self.WIDTH - 2*self.FRAME_THICKNESS)
        bpy.ops.object.transform_apply(transform_type='SCALE')
        right_panel.data.materials.append(materials['pvc'])
        panels.append(right_panel)
        
        # Bottom panel (black PVC)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(0, -self.HEIGHT/2, 0)
        )
        bottom_panel = bpy.context.active_object
        bottom_panel.name = "PVC_Bottom_Panel"
        bottom_panel.scale = (self.LENGTH - 2*self.FRAME_THICKNESS,
                             self.PANEL_THICKNESS,
                             self.WIDTH - 2*self.FRAME_THICKNESS)
        bpy.ops.object.transform_apply(transform_type='SCALE')
        bottom_panel.data.materials.append(materials['pvc'])
        panels.append(bottom_panel)
        
        return panels
    
    def create_front_doors(self, materials):
        """Create sliding front doors with optimized geometry"""
        doors = []
        
        door_width = (self.LENGTH - 3*self.FRAME_THICKNESS) / 2
        door_height = self.HEIGHT - 2*self.FRAME_THICKNESS
        
        # Left sliding door (acrylic)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(-door_width/2 - self.FRAME_THICKNESS/2, 0, self.WIDTH/2 - self.PANEL_THICKNESS/2)
        )
        left_door = bpy.context.active_object
        left_door.name = "PVC_Left_Door"
        left_door.scale = (door_width, door_height, self.PANEL_THICKNESS)
        bpy.ops.object.transform_apply(transform_type='SCALE')
        left_door.data.materials.append(materials['acrylic'])
        doors.append(left_door)
        
        # Right sliding door (acrylic)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(door_width/2 + self.FRAME_THICKNESS/2, 0, self.WIDTH/2 - self.PANEL_THICKNESS/2)
        )
        right_door = bpy.context.active_object
        right_door.name = "PVC_Right_Door"
        right_door.scale = (door_width, door_height, self.PANEL_THICKNESS)
        bpy.ops.object.transform_apply(transform_type='SCALE')
        right_door.data.materials.append(materials['acrylic'])
        doors.append(right_door)
        
        return doors
    
    def create_top_ventilation(self, materials):
        """Create simplified top ventilation screen"""
        # Create a single plane for the mesh instead of individual elements
        bpy.ops.mesh.primitive_plane_add(
            size=1,
            location=(0, self.HEIGHT/2, 0)
        )
        vent_screen = bpy.context.active_object
        vent_screen.name = "PVC_Top_Vent"
        vent_screen.scale = (self.LENGTH - 2*self.FRAME_THICKNESS,
                            self.WIDTH - 2*self.FRAME_THICKNESS,
                            1)
        bpy.ops.object.transform_apply(transform_type='SCALE')
        vent_screen.rotation_euler = (1.5708, 0, 0)  # 90 degrees X rotation
        bpy.ops.object.transform_apply(transform_type='ROTATION')
        vent_screen.data.materials.append(materials['mesh'])
        
        return vent_screen
    
    def optimize_for_web(self):
        """Apply web optimization settings"""
        # Select all objects
        bpy.ops.object.select_all(action='SELECT')
        
        # Apply modifiers and optimize
        for obj in bpy.context.selected_objects:
            if obj.type == 'MESH':
                # Set smooth shading for better appearance with fewer polys
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.shade_smooth()
                
                # Enable auto smooth for clean edges
                obj.data.use_auto_smooth = True
                obj.data.auto_smooth_angle = 0.785398  # 45 degrees
    
    def setup_basic_lighting(self):
        """Setup simple lighting for preview"""
        # Add sun light
        bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
        sun = bpy.context.active_object
        sun.data.energy = 3.0
        sun.rotation_euler = (0.785398, 0, 0.785398)  # 45 degrees
        
        # Set world background
        world = bpy.context.scene.world
        if world.use_nodes:
            bg_node = world.node_tree.nodes.get('Background')
            if bg_node:
                bg_node.inputs[0].default_value = (0.8, 0.8, 0.8, 1.0)  # Light gray
                bg_node.inputs[1].default_value = 0.5  # Reduce strength
    
    def setup_camera(self):
        """Setup camera for optimal viewing"""
        # Add camera
        bpy.ops.object.camera_add(location=(1.5, -2.0, 1.0))
        camera = bpy.context.active_object
        camera.rotation_euler = (1.1, 0, 0.785398)  # Angled view
        
        # Set as active camera
        bpy.context.scene.camera = camera
    
    def export_glb(self, filepath):
        """Export optimized model as GLB for web"""
        # Select all enclosure objects
        bpy.ops.object.select_all(action='SELECT')
        
        # Export settings optimized for web
        bpy.ops.export_scene.gltf(
            filepath=filepath,
            use_selection=True,
            export_format='GLB',
            export_materials='EXPORT',
            export_colors=True,
            export_cameras=False,
            export_lights=False,
            export_animations=False,
            export_apply=True,
            export_yup=True,
            export_tangents=False,
            export_normals=True,
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_draco_position_quantization=14,
            export_draco_normal_quantization=10,
            export_draco_texcoord_quantization=12
        )
        print(f"✅ Exported optimized PVC 50gal model to: {filepath}")
    
    def build_complete_enclosure(self):
        """Build the complete optimized PVC 50 gallon enclosure"""
        print("🔨 Creating optimized PVC 50 gallon enclosure...")
        
        # Create materials
        print("📐 Creating materials...")
        materials = self.create_optimized_materials()
        
        # Create frame
        print("🏗️ Creating frame structure...")
        frame = self.create_optimized_frame(materials)
        
        # Create PVC panels
        print("⬛ Creating PVC panels...")
        panels = self.create_pvc_panels(materials)
        
        # Create front doors
        print("🚪 Creating front doors...")
        doors = self.create_front_doors(materials)
        
        # Create ventilation
        print("🌬️ Creating top ventilation...")
        ventilation = self.create_top_ventilation(materials)
        
        # Optimize for web
        print("⚡ Applying web optimizations...")
        self.optimize_for_web()
        
        # Setup scene
        print("💡 Setting up lighting and camera...")
        self.setup_basic_lighting()
        self.setup_camera()
        
        # Group all objects
        all_objects = [frame] + panels + doors + [ventilation]
        
        # Join all objects into one optimized mesh
        bpy.ops.object.select_all(action='DESELECT')
        for obj in all_objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = all_objects[0]
        bpy.ops.object.join()
        
        final_object = bpy.context.active_object
        final_object.name = "PVC_50Gal_Enclosure"
        
        print("✅ PVC 50 gallon enclosure build complete!")
        return final_object

def main():
    """Main execution function"""
    print("🚀 Starting PVC 50 Gallon Enclosure Generation...")
    
    # Create builder
    builder = PVC50GalOptimized()
    
    # Build the enclosure
    enclosure = builder.build_complete_enclosure()
    
    # Get script directory for export path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    export_path = os.path.join(script_dir, "..", "models", "pvc_50gal_optimized.glb")
    
    # Create models directory if it doesn't exist
    models_dir = os.path.dirname(export_path)
    os.makedirs(models_dir, exist_ok=True)
    
    # Export the model
    print("📦 Exporting optimized model...")
    builder.export_glb(export_path)
    
    print("🎉 PVC 50 Gallon Enclosure generation complete!")
    print(f"📁 Model saved to: {export_path}")
    print("📊 Model stats:")
    print(f"   - Vertices: {len(enclosure.data.vertices)}")
    print(f"   - Faces: {len(enclosure.data.polygons)}")
    print(f"   - Materials: {len(enclosure.data.materials)}")

if __name__ == "__main__":
    main() 