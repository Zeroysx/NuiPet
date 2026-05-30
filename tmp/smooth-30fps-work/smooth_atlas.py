import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


WORK_DIR = Path(__file__).resolve().parent
ROOT = WORK_DIR.parents[1]
PET_JSON = ROOT / "web" / "assets" / "pets" / "luyi-nui" / "pet.json"
SPRITESHEET = ROOT / "web" / "assets" / "pets" / "luyi-nui" / "spritesheet.webp"
OUT_DIR = WORK_DIR / "generated"
PYTHON_CELL = (192, 208)


ACTION_LAYOUT = [
    ("idle", 0, 6, 5),
    ("run_right", 1, 24, 30),
    ("slide_stop_right", 2, 24, 30),
    ("run_left", 3, 24, 30),
    ("slide_stop_left", 4, 24, 30),
    ("wave", 5, 12, 12),
    ("jump", 6, 20, 30),
    ("cry", 7, 8, 4),
    ("idle_alt", 8, 8, 5),
    ("walk", 9, 24, 30),
    ("think", 10, 8, 5),
    ("idle_long", 11, 8, 4),
    ("sleep", 12, 23, 2),
    ("nod", 13, 12, 12),
    ("sit", 14, 8, 4),
    ("diagonal_pounce_right", 15, 24, 30),
    ("diagonal_pounce_left", 16, 24, 30),
    ("diagonal_pounce_land_right", 17, 24, 30),
    ("diagonal_pounce_land_left", 18, 24, 30),
    ("fall", 19, 32, 30),
    ("fall_land", 20, 32, 30),
    ("fall_getup", 21, 32, 30),
]

INTERPOLATED_ACTIONS = {
    "run_right",
    "run_left",
    "jump",
    "walk",
}

REVERSE_SOURCE_ACTIONS = {
    "diagonal_pounce_left",
}

BOTTOM_PAD_ACTIONS = {
    "fall",
    "fall_land",
    "fall_getup",
}

FRAME_OVERRIDES = {
    "fall_land": {
        28: 27,
        29: 30,
    },
}


def run(command):
    subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def ensure_clean_dir(path):
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def read_pet():
    return json.loads(PET_JSON.read_text(encoding="utf-8"))


def crop_frame(sheet, grid, row, column):
    width = grid["frameWidth"]
    height = grid["frameHeight"]
    return sheet.crop((column * width, row * height, (column + 1) * width, (row + 1) * height)).convert("RGBA")


def save_source_frames(sheet, pet, action, frames_dir):
    grid = pet["grid"]
    animation = pet["animations"][action]
    frames_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    columns = list(animation["frames"])
    if action in REVERSE_SOURCE_ACTIONS:
        columns.reverse()
    for index, column in enumerate(columns):
        frame = crop_frame(sheet, grid, animation["row"], column)
        path = frames_dir / f"{index:04d}.png"
        frame.save(path)
        paths.append(path)
    return paths


def make_loop_extension(frame_paths, loop):
    if not loop or len(frame_paths) < 2:
        return frame_paths

    extended = list(frame_paths)
    extended.append(frame_paths[0])
    return extended


def run_ffmpeg_interpolation(source_dir, source_fps, target_fps, target_count, output_dir, loop):
    ensure_clean_dir(output_dir)
    seq_dir = output_dir / "input"
    seq_dir.mkdir(parents=True, exist_ok=True)
    source_paths = sorted(source_dir.glob("*.png"))
    source_paths = make_loop_extension(source_paths, loop)
    for index, path in enumerate(source_paths):
        shutil.copyfile(path, seq_dir / f"{index:04d}.png")

    raw_dir = output_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg",
        "-y",
        "-framerate",
        str(source_fps),
        "-i",
        str(seq_dir / "%04d.png"),
        "-vf",
        f"minterpolate=fps={target_fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
        "-frames:v",
        str(max(target_count, 1)),
        "-start_number",
        "0",
        str(raw_dir / "%04d.png"),
    ]
    run(command)
    raw_paths = sorted(raw_dir.glob("*.png"))
    if len(raw_paths) < target_count:
        # FFmpeg may output fewer frames for very short non-looping clips. Pad with the final source pose.
        last = Image.open(source_paths[-1]).convert("RGBA")
        for index in range(target_count - len(raw_paths)):
            next_index = len(raw_paths) + index
            last.save(raw_dir / f"{next_index:04d}.png")
        raw_paths = sorted(raw_dir.glob("*.png"))
    return raw_paths[:target_count]


def resize_or_hold(source_paths, target_count):
    if not source_paths:
        return []
    if target_count <= len(source_paths):
        return [source_paths[round(i * (len(source_paths) - 1) / max(1, target_count - 1))] for i in range(target_count)]
    result = []
    for i in range(target_count):
        position = i * (len(source_paths) - 1) / max(1, target_count - 1)
        result.append(source_paths[round(position)])
    return result


def normalize_frame_alpha(image):
    image = image.convert("RGBA")
    rgba = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = rgba[x, y]
            if a < 245:
                rgba[x, y] = (0, 0, 0, 0)
            else:
                rgba[x, y] = (r, g, b, 255)
    return image


def enforce_bottom_padding(frame, min_padding=4):
    bbox = frame_bbox(frame)
    if not bbox:
        return frame
    _, _, _, bottom = bbox
    overflow = bottom - (frame.height - min_padding)
    if overflow <= 0:
        return frame
    shifted = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    shifted.alpha_composite(frame, (0, -overflow))
    return shifted


def source_mask_for_slot(source_frames, slot, target_count, loop):
    if len(source_frames) == 1 or target_count <= 1:
        return source_frames[0].getchannel("A")

    timeline_count = len(source_frames) if loop else len(source_frames) - 1
    position = (slot / target_count) * timeline_count if loop else slot * (len(source_frames) - 1) / (target_count - 1)
    low = math.floor(position) % len(source_frames)
    high = (low + 1) % len(source_frames) if loop else min(len(source_frames) - 1, low + 1)
    low_alpha = source_frames[low].getchannel("A").point(lambda value: 255 if value > 24 else 0)
    high_alpha = source_frames[high].getchannel("A").point(lambda value: 255 if value > 24 else 0)
    mask = Image.composite(Image.new("L", low_alpha.size, 255), low_alpha, high_alpha)
    return mask.filter(ImageFilter.MaxFilter(3))


def constrain_to_source_silhouette(frame, source_frames, slot, target_count, loop):
    mask = source_mask_for_slot(source_frames, slot, target_count, loop)
    result = frame.convert("RGBA")
    alpha = result.getchannel("A")
    alpha = Image.composite(alpha, Image.new("L", alpha.size, 0), mask)
    result.putalpha(alpha)
    return normalize_frame_alpha(result)


def frame_bbox(frame):
    alpha = frame.getchannel("A")
    return alpha.getbbox()


def center_of_bbox(bbox):
    if not bbox:
        return None
    left, top, right, bottom = bbox
    return ((left + right) / 2, (top + bottom) / 2)


def action_motion_track(values, target_count):
    if target_count <= 1:
        return [values[0] if values else 0]
    if not values:
        return [0] * target_count
    result = []
    for i in range(target_count):
        position = i * (len(values) - 1) / (target_count - 1)
        low = math.floor(position)
        high = min(len(values) - 1, low + 1)
        ratio = position - low
        result.append(round(values[low] * (1 - ratio) + values[high] * ratio, 2))
    return result


def build_contact_sheet(frames_by_action, output, title):
    cell_w, cell_h = PYTHON_CELL
    label_h = 22
    actions = list(frames_by_action.items())
    width = 32 * cell_w
    height = len(actions) * (cell_h + label_h)
    contact = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(contact)
    for row_index, (action, frames) in enumerate(actions):
        y = row_index * (cell_h + label_h)
        draw.rectangle((0, y, width, y + label_h), fill=(28, 28, 28, 255))
        draw.text((6, y + 4), f"{title} / {action} / {len(frames)} frames", fill=(255, 255, 255, 255))
        for frame_index, frame in enumerate(frames[:32]):
            x = frame_index * cell_w
            bg = (238, 238, 238, 255) if frame_index % 2 == 0 else (210, 210, 210, 255)
            draw.rectangle((x, y + label_h, x + cell_w, y + label_h + cell_h), fill=bg)
            contact.alpha_composite(frame, (x, y + label_h))
            draw.rectangle((x, y + label_h, x + cell_w - 1, y + label_h + cell_h - 1), outline=(90, 90, 90, 255))
    contact.save(output)


def checker_background(size, square=16):
    width, height = size
    image = Image.new("RGBA", size, (255, 255, 255, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, height, square):
        for x in range(0, width, square):
            fill = (220, 220, 220, 255) if ((x // square) + (y // square)) % 2 else (250, 250, 250, 255)
            draw.rectangle((x, y, x + square - 1, y + square - 1), fill=fill)
    return image


def build_preview_videos(frames_by_action, fps_by_action, output_dir):
    ensure_clean_dir(output_dir)
    for action, frames in frames_by_action.items():
        seq_dir = output_dir / f"{action}-frames"
        seq_dir.mkdir(parents=True, exist_ok=True)
        for index, frame in enumerate(frames):
            background = checker_background(frame.size)
            background.alpha_composite(frame)
            background.convert("RGB").save(seq_dir / f"{index:04d}.png")
        run([
            "ffmpeg",
            "-y",
            "-framerate",
            str(fps_by_action[action]),
            "-i",
            str(seq_dir / "%04d.png"),
            "-vf",
            "scale=384:416:flags=neighbor",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(output_dir / f"{action}.mp4"),
        ])


def build_alpha_report(frames_by_action):
    report = {}
    for action, frames in frames_by_action.items():
        boxes = [frame_bbox(frame) for frame in frames]
        centers = [center_of_bbox(box) for box in boxes]
        empty = sum(1 for box in boxes if not box)
        max_jump = 0
        previous = None
        for center in centers:
            if center is not None and previous is not None:
                max_jump = max(max_jump, abs(center[0] - previous[0]) + abs(center[1] - previous[1]))
            if center is not None:
                previous = center
        report[action] = {
            "frames": len(frames),
            "emptyFrames": empty,
            "maxCenterManhattanJump": round(max_jump, 2),
            "firstBBox": boxes[0],
            "lastBBox": boxes[-1],
        }
    return report


def build_smooth_atlas():
    pet = read_pet()
    sheet = Image.open(SPRITESHEET).convert("RGBA")
    grid = pet["grid"]
    ensure_clean_dir(OUT_DIR)
    source_root = OUT_DIR / "source-frames"
    smooth_root = OUT_DIR / "smooth-frames"
    source_root.mkdir(parents=True)
    smooth_root.mkdir(parents=True)

    frames_by_action = {}
    fps_by_action = {}
    rows_by_action = {name: row for name, row, _, _ in ACTION_LAYOUT}
    for action, _, target_count, target_fps in ACTION_LAYOUT:
        animation = pet["animations"][action]
        src_dir = source_root / action
        save_source_frames(sheet, pet, action, src_dir)
        loop = animation.get("loop", True) is not False
        if target_count > len(animation["frames"]) and action in INTERPOLATED_ACTIONS:
            raw_paths = run_ffmpeg_interpolation(src_dir, animation["fps"], target_fps, target_count, smooth_root / action, loop)
        else:
            raw_paths = resize_or_hold(sorted(src_dir.glob("*.png")), target_count)

        action_dir = smooth_root / action / "final"
        action_dir.mkdir(parents=True, exist_ok=True)
        source_images = [Image.open(path).convert("RGBA") for path in sorted(src_dir.glob("*.png"))]
        frames = []
        for index, path in enumerate(raw_paths):
            frame = constrain_to_source_silhouette(
                Image.open(path),
                source_images,
                index,
                target_count,
                loop,
            )
            if action in BOTTOM_PAD_ACTIONS:
                frame = enforce_bottom_padding(frame)
            frame.save(action_dir / f"{index:04d}.png")
            frames.append(frame)
        for target_index, source_index in FRAME_OVERRIDES.get(action, {}).items():
            replacement = frames[source_index].copy()
            replacement.save(action_dir / f"{target_index:04d}.png")
            frames[target_index] = replacement
        frames_by_action[action] = frames
        fps_by_action[action] = target_fps

    columns = 32
    rows = max(row for _, row, _, _ in ACTION_LAYOUT) + 1
    frame_w, frame_h = grid["frameWidth"], grid["frameHeight"]
    atlas = Image.new("RGBA", (columns * frame_w, rows * frame_h), (0, 0, 0, 0))
    for action, frames in frames_by_action.items():
        row = rows_by_action[action]
        for column, frame in enumerate(frames):
            atlas.alpha_composite(frame, (column * frame_w, row * frame_h))

    final_png = OUT_DIR / "spritesheet-smooth-30fps.png"
    final_webp = OUT_DIR / "spritesheet-smooth-30fps.webp"
    atlas.save(final_png)
    atlas.save(final_webp, "WEBP", lossless=True, quality=100, method=6)

    updated = json.loads(json.dumps(pet, ensure_ascii=False))
    updated["grid"]["columns"] = columns
    updated["grid"]["rows"] = rows
    for action, row, target_count, target_fps in ACTION_LAYOUT:
        animation = updated["animations"][action]
        animation["row"] = row
        animation["frames"] = list(range(target_count))
        animation["fps"] = target_fps
        if "motionX" in animation:
            animation["motionX"] = action_motion_track(animation["motionX"], target_count)
        if "motionY" in animation:
            animation["motionY"] = action_motion_track(animation["motionY"], target_count)

    updated["actionNotes"].update({
        "run_right": "Drag-only right-facing running variant; smoothed to 24 frames at 30 fps on row 1.",
        "run_left": "Drag-only left-facing running variant; smoothed to 24 frames at 30 fps on row 3.",
        "slide_stop_right": "Physics-only right-facing release animation, split onto row 2 and smoothed to 24 frames at 30 fps for horizontal inertia braking.",
        "slide_stop_left": "Physics-only left-facing release animation, split onto row 4 and smoothed to 24 frames at 30 fps for horizontal inertia braking.",
        "diagonal_pounce_right": "Physics-only rightward diagonal release pounce, split onto row 15 and smoothed to 24 frames at 30 fps.",
        "diagonal_pounce_left": "Physics-only leftward diagonal release pounce, split onto row 16 and smoothed to 24 frames at 30 fps without runtime mirroring.",
        "diagonal_pounce_land_right": "Physics-only rightward diagonal pounce landing completion, split onto row 17 and smoothed to 24 frames at 30 fps.",
        "diagonal_pounce_land_left": "Physics-only leftward diagonal pounce landing completion, split onto row 18 and smoothed to 24 frames at 30 fps.",
        "fall": "Physics-only airborne falling row, split onto row 19 and smoothed to 32 frames at 30 fps.",
        "fall_land": "Physics-only impact row, split onto row 20 and smoothed to 32 frames at 30 fps.",
        "fall_getup": "Physics-only prone-to-standing get-up row, split onto row 21 and smoothed to 32 frames at 30 fps.",
        "walk": "Light jog row smoothed to 24 frames at 30 fps with synchronized motionX offsets.",
        "nod": "Former stretch row; blank trailing frames removed and hand gesture smoothed to 12 frames.",
    })

    metadata_path = OUT_DIR / "pet.smooth-30fps.json"
    metadata_path.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    qa_dir = WORK_DIR / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    build_contact_sheet(frames_by_action, qa_dir / "smooth-30fps-contact.png", "smooth 30fps atlas")
    build_preview_videos(frames_by_action, fps_by_action, qa_dir / "videos")
    report = build_alpha_report(frames_by_action)
    (qa_dir / "smooth-30fps-review.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {
        "atlasPng": str(final_png),
        "atlasWebp": str(final_webp),
        "petJson": str(metadata_path),
        "contactSheet": str(qa_dir / "smooth-30fps-contact.png"),
        "review": str(qa_dir / "smooth-30fps-review.json"),
        "columns": columns,
        "rows": rows,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()
    result = build_smooth_atlas()
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
