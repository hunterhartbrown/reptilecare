"""
REPTIZOO 36x18x18 Terrarium - Procedural 3D Model Generator
Uses Blender Python API to create accurate terrarium model with animation support

Requirements:
- Blender 3.0+ with Python API
- Run this script within Blender's Text Editor or via command line

Features:
- Accurate 36"x18"x18" dimensions
- Glass panels with realistic materials
- Double hinge front doors
- Screen ventilation (top and sides)
- Aluminum frame structure
- Procedural textures and materials
- Animation capabilities for opening doors
"""

import bpy
import bmesh
from mathutils import Vector, Matrix
import math

class ReptizooTerrariumBuilder:
    def __init__(self):
        # Convert inches to meters (Blender units)
        self.INCH_TO_METER = 0.0254
        
        # Terrarium dimensions in inches
        self.LENGTH = 36 * self.INCH_TO_METER  # 36 inches
        self.WIDTH = 18 * self.INCH_TO_METER   # 18 inches  
        self.HEIGHT = 18 * self.INCH_TO_METER  # 18 inches
        
        # Frame thickness in inches
        self.FRAME_THICKNESS = 0.75 * self.INCH_TO_METER
        self.GLASS_THICKNESS = 0.2 * self.INCH_TO_METER
        
        # Clear existing scene
        self.clear_scene()
        
        # Material references
        self.materials = {}
        
    def clear_scene(self):
        """Clear all objects from the scene"""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)
        
    def create_materials(self):
        """Create realistic materials for the terrarium"""
        
        # Glass material
        glass_mat = bpy.data.materials.new(name="Glass_Panel")
        glass_mat.use_nodes = True
        glass_mat.node_tree.nodes.clear()
        
        # Glass shader setup
        bsdf = glass_mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Transmission'].default_value = 0.95
        bsdf.inputs['Roughness'].default_value = 0.0
        bsdf.inputs['IOR'].default_value = 1.52
        bsdf.inputs['Alpha'].default_value = 0.1
        
        output = glass_mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
        glass_mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
        
        glass_mat.blend_method = 'BLEND'
        self.materials['glass'] = glass_mat
        
        # Aluminum frame material
        aluminum_mat = bpy.data.materials.new(name="Aluminum_Frame")
        aluminum_mat.use_nodes = True
        aluminum_mat.node_tree.nodes.clear()
        
        bsdf_aluminum = aluminum_mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf_aluminum.inputs['Base Color'].default_value = (0.7, 0.7, 0.75, 1.0)
        bsdf_aluminum.inputs['Metallic'].default_value = 0.9
        bsdf_aluminum.inputs['Roughness'].default_value = 0.1
        
        output_aluminum = aluminum_mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
        aluminum_mat.node_tree.links.new(bsdf_aluminum.outputs['BSDF'], output_aluminum.inputs['Surface'])
        self.materials['aluminum'] = aluminum_mat
        
        # Screen mesh material
        screen_mat = bpy.data.materials.new(name="Screen_Mesh")
        screen_mat.use_nodes = True
        screen_mat.node_tree.nodes.clear()
        
        bsdf_screen = screen_mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf_screen.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1.0)
        bsdf_screen.inputs['Metallic'].default_value = 0.5
        bsdf_screen.inputs['Roughness'].default_value = 0.8
        
        output_screen = screen_mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
        screen_mat.node_tree.links.new(bsdf_screen.outputs['BSDF'], output_screen.inputs['Surface'])
        self.materials['screen'] = screen_mat
        
    def create_frame_profile(self, length):
        """Create an aluminum frame profile"""
        bpy.ops.mesh.primitive_cube_add()
        frame = bpy.context.active_object
        frame.scale = (length/2, self.FRAME_THICKNESS/2, self.FRAME_THICKNESS/2)
        frame.data.materials.append(self.materials['aluminum'])
        return frame
        
    def create_glass_panel(self, width, height, name):
        """Create a glass panel"""
        bpy.ops.mesh.primitive_cube_add()
        panel = bpy.context.active_object
        panel.name = name
        panel.scale = (self.GLASS_THICKNESS/2, width/2, height/2)
        panel.data.materials.append(self.materials['glass'])
        return panel
        
    def create_screen_panel(self, width, height, name):
        """Create a ventilation screen panel"""
        # Create base mesh
        bpy.ops.mesh.primitive_plane_add()
        screen = bpy.context.active_object
        screen.name = name
        screen.scale = (width/2, height/2, 1)
        
        # Add wireframe modifier for mesh effect
        wireframe = screen.modifiers.new(name="Wireframe", type='WIREFRAME')
        wireframe.thickness = 0.001
        wireframe.use_replace = False
        
        screen.data.materials.append(self.materials['screen'])
        return screen
        
    def build_frame_structure(self):
        """Build the aluminum frame structure"""
        frame_parts = []
        
        # Bottom frame (rectangular base)
        bottom_long_1 = self.create_frame_profile(self.LENGTH)
        bottom_long_1.location = (0, -self.WIDTH/2 + self.FRAME_THICKNESS/2, -self.HEIGHT/2 + self.FRAME_THICKNESS/2)
        frame_parts.append(bottom_long_1)
        
        bottom_long_2 = self.create_frame_profile(self.LENGTH)
        bottom_long_2.location = (0, self.WIDTH/2 - self.FRAME_THICKNESS/2, -self.HEIGHT/2 + self.FRAME_THICKNESS/2)
        frame_parts.append(bottom_long_2)
        
        bottom_short_1 = self.create_frame_profile(self.WIDTH)
        bottom_short_1.rotation_euler = (0, 0, math.pi/2)
        bottom_short_1.location = (-self.LENGTH/2 + self.FRAME_THICKNESS/2, 0, -self.HEIGHT/2 + self.FRAME_THICKNESS/2)
        frame_parts.append(bottom_short_1)
        
        bottom_short_2 = self.create_frame_profile(self.WIDTH)
        bottom_short_2.rotation_euler = (0, 0, math.pi/2)
        bottom_short_2.location = (self.LENGTH/2 - self.FRAME_THICKNESS/2, 0, -self.HEIGHT/2 + self.FRAME_THICKNESS/2)
        frame_parts.append(bottom_short_2)
        
        # Top frame (identical to bottom)
        top_long_1 = self.create_frame_profile(self.LENGTH)
        top_long_1.location = (0, -self.WIDTH/2 + self.FRAME_THICKNESS/2, self.HEIGHT/2 - self.FRAME_THICKNESS/2)
        frame_parts.append(top_long_1)
        
        top_long_2 = self.create_frame_profile(self.LENGTH)
        top_long_2.location = (0, self.WIDTH/2 - self.FRAME_THICKNESS/2, self.HEIGHT/2 - self.FRAME_THICKNESS/2)
        frame_parts.append(top_long_2)
        
        top_short_1 = self.create_frame_profile(self.WIDTH)
        top_short_1.rotation_euler = (0, 0, math.pi/2)
        top_short_1.location = (-self.LENGTH/2 + self.FRAME_THICKNESS/2, 0, self.HEIGHT/2 - self.FRAME_THICKNESS/2)
        frame_parts.append(top_short_1)
        
        top_short_2 = self.create_frame_profile(self.WIDTH)
        top_short_2.rotation_euler = (0, 0, math.pi/2)
        top_short_2.location = (self.LENGTH/2 - self.FRAME_THICKNESS/2, 0, self.HEIGHT/2 - self.FRAME_THICKNESS/2)
        frame_parts.append(top_short_2)
        
        # Vertical corner posts
        for x in [-self.LENGTH/2 + self.FRAME_THICKNESS/2, self.LENGTH/2 - self.FRAME_THICKNESS/2]:
            for y in [-self.WIDTH/2 + self.FRAME_THICKNESS/2, self.WIDTH/2 - self.FRAME_THICKNESS/2]:
                post = self.create_frame_profile(self.HEIGHT)
                post.rotation_euler = (math.pi/2, 0, 0)
                post.location = (x, y, 0)
                frame_parts.append(post)
        
        return frame_parts
        
    def build_glass_panels(self):
        """Build all glass panels"""
        panels = []
        
        # Back panel
        back_panel = self.create_glass_panel(self.WIDTH, self.HEIGHT, "Back_Glass")
        back_panel.location = (-self.LENGTH/2 + self.GLASS_THICKNESS/2, 0, 0)
        panels.append(back_panel)
        
        # Side panels
        left_panel = self.create_glass_panel(self.LENGTH, self.HEIGHT, "Left_Glass")
        left_panel.rotation_euler = (0, 0, math.pi/2)
        left_panel.location = (0, -self.WIDTH/2 + self.GLASS_THICKNESS/2, 0)
        panels.append(left_panel)
        
        right_panel = self.create_glass_panel(self.LENGTH, self.HEIGHT, "Right_Glass")
        right_panel.rotation_euler = (0, 0, math.pi/2)
        right_panel.location = (0, self.WIDTH/2 - self.GLASS_THICKNESS/2, 0)
        panels.append(right_panel)
        
        # Bottom panel
        bottom_panel = self.create_glass_panel(self.WIDTH, self.LENGTH, "Bottom_Glass")
        bottom_panel.rotation_euler = (math.pi/2, 0, 0)
        bottom_panel.location = (0, 0, -self.HEIGHT/2 + self.GLASS_THICKNESS/2)
        panels.append(bottom_panel)
        
        return panels
        
    def build_front_doors(self):
        """Build hinged front doors"""
        doors = []
        door_width = self.LENGTH / 2 - self.FRAME_THICKNESS
        
        # Left door
        left_door = self.create_glass_panel(door_width, self.HEIGHT - 2*self.FRAME_THICKNESS, "Left_Door")
        left_door.location = (-door_width/2 - self.FRAME_THICKNESS/2, self.WIDTH/2 - self.GLASS_THICKNESS/2, 0)
        doors.append(left_door)
        
        # Right door  
        right_door = self.create_glass_panel(door_width, self.HEIGHT - 2*self.FRAME_THICKNESS, "Right_Door")
        right_door.location = (door_width/2 + self.FRAME_THICKNESS/2, self.WIDTH/2 - self.GLASS_THICKNESS/2, 0)
        doors.append(right_door)
        
        return doors
        
    def build_ventilation_screens(self):
        """Build ventilation screens"""
        screens = []
        
        # Top screen (main ventilation)
        top_screen = self.create_screen_panel(
            self.LENGTH - 2*self.FRAME_THICKNESS, 
            self.WIDTH - 2*self.FRAME_THICKNESS, 
            "Top_Screen"
        )
        top_screen.rotation_euler = (math.pi/2, 0, 0)
        top_screen.location = (0, 0, self.HEIGHT/2 - self.FRAME_THICKNESS/2)
        screens.append(top_screen)
        
        # Side ventilation strips
        side_screen_height = self.HEIGHT * 0.3  # 30% of height for side vents
        
        left_screen = self.create_screen_panel(side_screen_height, self.LENGTH * 0.8, "Left_Side_Screen")
        left_screen.rotation_euler = (0, 0, math.pi/2)
        left_screen.location = (0, -self.WIDTH/2 + 0.001, self.HEIGHT * 0.2)
        screens.append(left_screen)
        
        right_screen = self.create_screen_panel(side_screen_height, self.LENGTH * 0.8, "Right_Side_Screen")
        right_screen.rotation_euler = (0, 0, math.pi/2)
        right_screen.location = (0, self.WIDTH/2 - 0.001, self.HEIGHT * 0.2)
        screens.append(right_screen)
        
        return screens
        
    def setup_door_hinges(self, doors):
        """Setup hinge constraints for door animation"""
        for i, door in enumerate(doors):
            # Create empty object as hinge pivot
            bpy.ops.object.empty_add(type='PLAIN_AXES')
            hinge = bpy.context.active_object
            hinge.name = f"Door_Hinge_{i+1}"
            
            # Position hinge at door edge
            if i == 0:  # Left door
                hinge.location = (-self.LENGTH/2 + self.FRAME_THICKNESS, self.WIDTH/2, 0)
            else:  # Right door
                hinge.location = (self.LENGTH/2 - self.FRAME_THICKNESS, self.WIDTH/2, 0)
            
            # Parent door to hinge
            door.parent = hinge
            door.parent_type = 'OBJECT'
            
            # Adjust door location relative to hinge
            if i == 0:  # Left door
                door.location = (door.dimensions.x/2, 0, 0)
            else:  # Right door  
                door.location = (-door.dimensions.x/2, 0, 0)
                
    def create_door_animation(self):
        """Create animation for opening/closing doors"""
        frame_start = 1
        frame_mid = 60
        frame_end = 120
        
        # Set keyframes for closed position
        bpy.context.scene.frame_set(frame_start)
        for obj in bpy.context.scene.objects:
            if "Door_Hinge" in obj.name:
                obj.rotation_euler = (0, 0, 0)
                obj.keyframe_insert(data_path="rotation_euler", frame=frame_start)
        
        # Set keyframes for open position
        bpy.context.scene.frame_set(frame_mid)
        hinge_1 = bpy.data.objects.get("Door_Hinge_1")
        hinge_2 = bpy.data.objects.get("Door_Hinge_2")
        
        if hinge_1:
            hinge_1.rotation_euler = (0, 0, -math.pi/2)  # 90 degrees left
            hinge_1.keyframe_insert(data_path="rotation_euler", frame=frame_mid)
            
        if hinge_2:
            hinge_2.rotation_euler = (0, 0, math.pi/2)   # 90 degrees right  
            hinge_2.keyframe_insert(data_path="rotation_euler", frame=frame_mid)
        
        # Set keyframes for closed position (end)
        bpy.context.scene.frame_set(frame_end)
        for obj in bpy.context.scene.objects:
            if "Door_Hinge" in obj.name:
                obj.rotation_euler = (0, 0, 0)
                obj.keyframe_insert(data_path="rotation_euler", frame=frame_end)
                
        # Set interpolation to smooth
        for obj in bpy.context.scene.objects:
            if "Door_Hinge" in obj.name and obj.animation_data:
                for fcurve in obj.animation_data.action.fcurves:
                    for keyframe in fcurve.keyframe_points:
                        keyframe.interpolation = 'BEZIER'
                        keyframe.handle_left_type = 'AUTO'
                        keyframe.handle_right_type = 'AUTO'
    
    def setup_lighting(self):
        """Setup realistic lighting for rendering"""
        # Remove default light
        if bpy.data.objects.get("Light"):
            bpy.data.objects.remove(bpy.data.objects["Light"], do_unlink=True)
            
        # Add HDRI environment lighting
        world = bpy.context.scene.world
        world.use_nodes = True
        world.node_tree.nodes.clear()
        
        background = world.node_tree.nodes.new(type='ShaderNodeBackground')
        background.inputs['Strength'].default_value = 1.0
        background.inputs['Color'].default_value = (0.9, 0.9, 1.0, 1.0)
        
        output = world.node_tree.nodes.new(type='ShaderNodeOutputWorld')
        world.node_tree.links.new(background.outputs['Background'], output.inputs['Surface'])
        
        # Add key light
        bpy.ops.object.light_add(type='SUN')
        sun = bpy.context.active_object
        sun.location = (5, -5, 10)
        sun.rotation_euler = (math.pi/4, 0, math.pi/4)
        sun.data.energy = 3.0
        
        # Add fill light
        bpy.ops.object.light_add(type='AREA')
        area_light = bpy.context.active_object
        area_light.location = (-5, 5, 5)
        area_light.rotation_euler = (-math.pi/4, 0, -math.pi/4)
        area_light.data.energy = 50.0
        area_light.data.size = 2.0
        
    def setup_camera(self):
        """Setup camera for optimal viewing"""
        # Remove default camera
        if bpy.data.objects.get("Camera"):
            bpy.data.objects.remove(bpy.data.objects["Camera"], do_unlink=True)
            
        # Add new camera
        bpy.ops.object.camera_add()
        camera = bpy.context.active_object
        camera.location = (2.5, -2.5, 1.5)
        camera.rotation_euler = (math.pi/3, 0, math.pi/4)
        
        # Set as active camera
        bpy.context.scene.camera = camera
        
    def setup_render_settings(self):
        """Configure render settings for high quality output"""
        scene = bpy.context.scene
        scene.render.engine = 'CYCLES'
        scene.render.resolution_x = 1920
        scene.render.resolution_y = 1080
        scene.render.resolution_percentage = 100
        
        # Enable GPU rendering if available
        preferences = bpy.context.preferences.addons['cycles'].preferences
        if hasattr(preferences, 'compute_device_type'):
            preferences.compute_device_type = 'CUDA'  # or 'OPENCL'
        
        scene.cycles.samples = 128
        scene.cycles.use_denoising = True
        
    def build_complete_terrarium(self):
        """Build the complete terrarium model"""
        print("Creating materials...")
        self.create_materials()
        
        print("Building frame structure...")
        frame_parts = self.build_frame_structure()
        
        print("Building glass panels...")
        glass_panels = self.build_glass_panels()
        
        print("Building front doors...")
        doors = self.build_front_doors()
        
        print("Building ventilation screens...")
        screens = self.build_ventilation_screens()
        
        print("Setting up door hinges...")
        self.setup_door_hinges(doors)
        
        print("Creating door animation...")
        self.create_door_animation()
        
        print("Setting up lighting...")
        self.setup_lighting()
        
        print("Setting up camera...")
        self.setup_camera()
        
        print("Configuring render settings...")
        self.setup_render_settings()
        
        # Group all objects
        all_objects = frame_parts + glass_panels + doors + screens
        for obj in all_objects:
            obj.select_set(True)
        bpy.ops.object.join()
        
        terrarium = bpy.context.active_object
        terrarium.name = "REPTIZOO_36x18x18_Terrarium"
        
        print(f"✅ REPTIZOO 36x18x18 Terrarium model completed!")
        print(f"📐 Dimensions: {self.LENGTH/self.INCH_TO_METER:.1f}\" × {self.WIDTH/self.INCH_TO_METER:.1f}\" × {self.HEIGHT/self.INCH_TO_METER:.1f}\"")
        print(f"🎬 Animation frames: 1-120 (doors opening/closing)")
        print(f"🎨 Render ready with Cycles engine")
        
        return terrarium

# Main execution
if __name__ == "__main__":
    builder = ReptizooTerrariumBuilder()
    terrarium = builder.build_complete_terrarium()
    
    # Optional: Save blend file
    bpy.ops.wm.save_as_mainfile(filepath="/tmp/reptizoo_terrarium.blend")
    print("💾 Model saved as reptizoo_terrarium.blend") 