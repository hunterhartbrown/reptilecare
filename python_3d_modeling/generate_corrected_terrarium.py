"""
Generate Corrected REPTIZOO 36x18x18 Terrarium Model
Fixes door gap issue and adds central lock mechanism
Exports as GLB for web viewer
"""

import trimesh
import numpy as np

# ---------- Latch geometry (rounded clamp) ----------
def _rounded_rectangle_2d(w, h, r, sections=16):
    import math
    import trimesh
    r = min(r, min(w, h) * 0.49)
    cx = [-w/2 + r,  w/2 - r,  w/2 - r, -w/2 + r]
    cy = [-h/2 + r, -h/2 + r,  h/2 - r,  h/2 - r]
    ang0 = [math.pi, math.pi*1.5, 0.0, math.pi*0.5]
    pts = []
    for i in range(4):
        for j in range(sections+1):
            a = ang0[i] + (j/sections)*math.pi/2.0
            pts.append([cx[i] + r*math.cos(a), cy[i] + r*math.sin(a)])
    return trimesh.path.polygons.polygon(pts)

def make_latch(
    glass_thickness=0.0045,
    body_w=0.018, body_h=0.014, body_d=0.010,
    corner_r=0.0025,
    rail_width=0.012, rail_height=0.006, rail_clearance=0.0004, lip_thickness=0.0012,
    screw_shank_dia=0.003, screw_head_dia=0.006, screw_head_depth=0.002,
):
    import trimesh, numpy as np
    rr = _rounded_rectangle_2d(body_w, body_h, corner_r)
    body = trimesh.creation.extrude_polygon(rr, height=body_d)
    body.apply_translation([0, 0, body_d/2])
    # slot
    slot_depth = body_d - lip_thickness
    slot = trimesh.creation.box(extents=[glass_thickness, body_h*0.9, slot_depth])
    slot.apply_translation([0, 0, slot_depth/2])
    # rail channel
    ch_w = rail_width + rail_clearance*2
    ch_h = rail_height + rail_clearance
    ch_d = body_d - lip_thickness
    channel = trimesh.creation.box(extents=[ch_w, ch_h, ch_d])
    channel.apply_translation([0, -body_h/2 + ch_h/2, ch_d/2])
    # screw hole
    shank = trimesh.creation.cylinder(radius=screw_shank_dia/2, height=body_d*1.2, sections=24)
    shank.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2, [1,0,0]))
    shank.apply_translation([0, 0, body_d/2])
    head = trimesh.creation.cylinder(radius=screw_head_dia/2, height=screw_head_depth, sections=48)
    head.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2, [1,0,0]))
    head.apply_translation([0, 0, body_d - screw_head_depth/2])
    # booleans
    latch = body.difference([slot, channel, shank, head])
    latch.visual.face_colors = [20, 20, 20, 255]
    return latch

def add_latch_to_terrarium(frame_thickness, width, height, glass_thickness):
    latch = make_latch(glass_thickness=glass_thickness)
    body_h = 0.014
    y_front_glass = width/2 - glass_thickness/2
    z_center = -height/2 + frame_thickness + body_h/2
    latch.apply_translation([0, y_front_glass + 0.001, z_center])
    return latch

def create_corrected_terrarium():
    """Create corrected terrarium using Trimesh library"""
    
    # Dimensions in meters (36x18x18 inches)
    INCH_TO_METER = 0.0254
    length = 36 * INCH_TO_METER
    width = 18 * INCH_TO_METER  
    height = 18 * INCH_TO_METER
    
    glass_thickness = 0.005  # 5mm glass
    frame_thickness = 0.75 * INCH_TO_METER  # 0.75 inch frame
    
    # Store all mesh parts
    panels = []
    
    # ========================================
    # FRAME STRUCTURE
    # ========================================
    
    # Bottom frame (rectangular base)
    bottom_frame_parts = []
    
    # Bottom long frames
    bottom_long_1 = trimesh.creation.box(extents=[length, frame_thickness, frame_thickness])
    bottom_long_1.apply_translation([0, -width/2 + frame_thickness/2, -height/2 + frame_thickness/2])
    bottom_frame_parts.append(bottom_long_1)
    
    bottom_long_2 = trimesh.creation.box(extents=[length, frame_thickness, frame_thickness])
    bottom_long_2.apply_translation([0, width/2 - frame_thickness/2, -height/2 + frame_thickness/2])
    bottom_frame_parts.append(bottom_long_2)
    
    # Bottom short frames
    bottom_short_1 = trimesh.creation.box(extents=[frame_thickness, width, frame_thickness])
    bottom_short_1.apply_translation([-length/2 + frame_thickness/2, 0, -height/2 + frame_thickness/2])
    bottom_frame_parts.append(bottom_short_1)
    
    bottom_short_2 = trimesh.creation.box(extents=[frame_thickness, width, frame_thickness])
    bottom_short_2.apply_translation([length/2 - frame_thickness/2, 0, -height/2 + frame_thickness/2])
    bottom_frame_parts.append(bottom_short_2)
    
    # Top frame (identical to bottom)
    top_long_1 = trimesh.creation.box(extents=[length, frame_thickness, frame_thickness])
    top_long_1.apply_translation([0, -width/2 + frame_thickness/2, height/2 - frame_thickness/2])
    bottom_frame_parts.append(top_long_1)
    
    top_long_2 = trimesh.creation.box(extents=[length, frame_thickness, frame_thickness])
    top_long_2.apply_translation([0, width/2 - frame_thickness/2, height/2 - frame_thickness/2])
    bottom_frame_parts.append(top_long_2)
    
    top_short_1 = trimesh.creation.box(extents=[frame_thickness, width, frame_thickness])
    top_short_1.apply_translation([-length/2 + frame_thickness/2, 0, height/2 - frame_thickness/2])
    bottom_frame_parts.append(top_short_1)
    
    top_short_2 = trimesh.creation.box(extents=[frame_thickness, width, frame_thickness])
    top_short_2.apply_translation([length/2 - frame_thickness/2, 0, height/2 - frame_thickness/2])
    bottom_frame_parts.append(top_short_2)
    
    # Vertical corner posts
    corner_positions = [
        [-length/2 + frame_thickness/2, -width/2 + frame_thickness/2, 0],
        [-length/2 + frame_thickness/2, width/2 - frame_thickness/2, 0],
        [length/2 - frame_thickness/2, -width/2 + frame_thickness/2, 0],
        [length/2 - frame_thickness/2, width/2 - frame_thickness/2, 0]
    ]
    
    for pos in corner_positions:
        post = trimesh.creation.box(extents=[frame_thickness, frame_thickness, height])
        post.apply_translation(pos)
        bottom_frame_parts.append(post)
    
    # IMPORTANT: Add central vertical frame element for door support
    center_post = trimesh.creation.box(extents=[frame_thickness, frame_thickness, height - 2*frame_thickness])
    center_post.apply_translation([0, width/2 - frame_thickness/2, 0])
    bottom_frame_parts.append(center_post)
    
    # Combine frame parts and set aluminum color
    frame_mesh = trimesh.util.concatenate(bottom_frame_parts)
    frame_mesh.visual.face_colors = [180, 180, 190, 255]  # Aluminum color
    panels.append(frame_mesh)
    
    # ========================================
    # GLASS PANELS
    # ========================================
    
    # Back panel
    back_panel = trimesh.creation.box(extents=[glass_thickness, width, height])
    back_panel.apply_translation([-length/2 + glass_thickness/2, 0, 0])
    back_panel.visual.face_colors = [100, 150, 255, 80]  # Semi-transparent blue glass
    panels.append(back_panel)
    
    # Side panels
    left_panel = trimesh.creation.box(extents=[length, glass_thickness, height])
    left_panel.apply_translation([0, -width/2 + glass_thickness/2, 0])
    left_panel.visual.face_colors = [100, 150, 255, 80]
    panels.append(left_panel)
    
    right_panel = trimesh.creation.box(extents=[length, glass_thickness, height])
    right_panel.apply_translation([0, width/2 - glass_thickness/2, 0])
    right_panel.visual.face_colors = [100, 150, 255, 80]
    panels.append(right_panel)
    
    # Bottom panel
    bottom_panel = trimesh.creation.box(extents=[length, width, glass_thickness])
    bottom_panel.apply_translation([0, 0, -height/2 + glass_thickness/2])
    bottom_panel.visual.face_colors = [100, 150, 255, 80]
    panels.append(bottom_panel)
    
    # ========================================
    # FRONT DOORS (CORRECTED POSITIONING)
    # ========================================
    
    # Fixed door width calculation to eliminate gap
    door_width = (length - frame_thickness) / 2  # Account for center frame
    door_height = height - 2*frame_thickness
    
    # Left door - positioned to close flush against center
    left_door = trimesh.creation.box(extents=[door_width, glass_thickness, door_height])
    left_door.apply_translation([-door_width/2, width/2 - glass_thickness/2, 0])
    left_door.visual.face_colors = [100, 150, 255, 80]
    panels.append(left_door)
    
    # Right door - positioned to close flush against center
    right_door = trimesh.creation.box(extents=[door_width, glass_thickness, door_height])
    right_door.apply_translation([door_width/2, width/2 - glass_thickness/2, 0])
    right_door.visual.face_colors = [100, 150, 255, 80]
    panels.append(right_door)
    
    # ========================================
    # CENTRAL LATCH (replaces cylindrical lock)
    # ========================================
    latch_mesh = add_latch_to_terrarium(
        frame_thickness=frame_thickness,
        width=width,
        height=height,
        glass_thickness=glass_thickness
    )
    panels.append(latch_mesh)
    
    # ========================================
    # VENTILATION SCREENS
    # ========================================
    
    # Top screen (main ventilation)
    screen_length = length - 2*frame_thickness
    screen_width = width - 2*frame_thickness
    
    # Create a simple perforated mesh representation
    top_screen = trimesh.creation.box(extents=[screen_length, screen_width, 0.002])
    top_screen.apply_translation([0, 0, height/2 - frame_thickness/2])
    top_screen.visual.face_colors = [60, 60, 60, 200]  # Dark screen mesh
    panels.append(top_screen)
    
    # Side ventilation strips (30% of height)
    side_screen_height = height * 0.3
    side_screen_length = length * 0.8
    
    left_screen = trimesh.creation.box(extents=[side_screen_length, 0.002, side_screen_height])
    left_screen.apply_translation([0, -width/2 + 0.001, height * 0.1])
    left_screen.visual.face_colors = [60, 60, 60, 200]
    panels.append(left_screen)
    
    right_screen = trimesh.creation.box(extents=[side_screen_length, 0.002, side_screen_height])
    right_screen.apply_translation([0, width/2 - 0.001, height * 0.1])
    right_screen.visual.face_colors = [60, 60, 60, 200]
    panels.append(right_screen)
    
    # ========================================
    # COMBINE ALL PARTS
    # ========================================
    
    # Combine all mesh parts into single terrarium
    terrarium = trimesh.util.concatenate(panels)
    
    # Set overall properties
    terrarium.metadata['name'] = 'REPTIZOO_36x18x18_Corrected'
    terrarium.metadata['dimensions'] = [36, 18, 18]
    terrarium.metadata['fixes'] = [
        'Eliminated door gap',
        'Added central lock mechanism', 
        'Added central frame support',
        'Proper door positioning'
    ]
    
    return terrarium

def main():
    """Generate and export the corrected terrarium model"""
    print("🔧 Generating corrected REPTIZOO 36x18x18 terrarium...")
    
    # Create the corrected model
    terrarium = create_corrected_terrarium()
    
    print(f"✅ Model created successfully!")
    print(f"📊 Vertices: {len(terrarium.vertices)}")
    print(f"📐 Faces: {len(terrarium.faces)}")
    print(f"📏 Bounds: {terrarium.bounds}")
    
    # Export as GLB for web viewer
    output_path = "../models/reptizoo_36x18x18.glb"
    terrarium.export(output_path)
    print(f"💾 Exported to: {output_path}")
    
    # Also export as OBJ for backup
    terrarium.export("../models/reptizoo_36x18x18_corrected.obj")
    print(f"📁 Backup OBJ saved")
    
    print(f"\n🎯 FIXES APPLIED:")
    print(f"   ✅ Door gap eliminated - doors now meet at center")
    print(f"   ✅ Central lock mechanism added")
    print(f"   ✅ Central frame support structure added")
    print(f"   ✅ Proper door positioning implemented")
    
    print(f"\n🌐 Ready for web viewer!")
    print(f"   Your enclosure builder will now load the corrected model.")

if __name__ == "__main__":
    main() 