#!/usr/bin/env python3
"""Regenerate chess piece avatars with strict visual consistency.
Each piece has a fixed color, material, and detailed description repeated in every prompt.
"""

import json, time, subprocess, sys, urllib.request

COMFY_API = "http://10.0.0.239:4455"
COMFY_SERVER = "10.0.0.239"
COMFY_OUTPUT = "/mnt/tools/comfy-ui/output"
DST = "/Users/ralphyz/Tools/spelling_bee/spelling-bee/public/avatars"

def build_workflow(prompt: str, seed: int, prefix: str) -> dict:
    return {
        "prompt": {
            "12": {"class_type": "UNETLoader", "inputs": {"unet_name": "flux1-dev.safetensors", "weight_dtype": "default"}},
            "11": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "flux/t5xxl_fp16.safetensors", "clip_name2": "flux/clip_l.safetensors", "type": "flux"}},
            "10": {"class_type": "VAELoader", "inputs": {"vae_name": "flux/ae.safetensors"}},
            "30": {"class_type": "ModelSamplingFlux", "inputs": {"model": ["12", 0], "max_shift": 1.15, "base_shift": 0.5, "width": 512, "height": 512}},
            "47": {"class_type": "LoraLoader", "inputs": {"model": ["30", 0], "clip": ["11", 0], "lora_name": "flux/PixarPerfect_3D_Animation_Style_FLUX-000001.safetensors", "strength_model": 1.0, "strength_clip": 1.0}},
            "6":  {"class_type": "CLIPTextEncode", "inputs": {"clip": ["47", 1], "text": prompt}},
            "26": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["6", 0], "guidance": 3.5}},
            "25": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
            "27": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 512, "height": 512, "batch_size": 1}},
            "16": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
            "17": {"class_type": "BasicScheduler", "inputs": {"model": ["30", 0], "scheduler": "beta", "steps": 30, "denoise": 1.0}},
            "22": {"class_type": "BasicGuider", "inputs": {"model": ["47", 0], "conditioning": ["26", 0]}},
            "13": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["25", 0], "guider": ["22", 0], "sampler": ["16", 0], "sigmas": ["17", 0], "latent_image": ["27", 0]}},
            "8":  {"class_type": "VAEDecode", "inputs": {"samples": ["13", 0], "vae": ["10", 0]}},
            "9":  {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
        }
    }

def submit(prompt: str, seed: int, prefix: str) -> str:
    wf = build_workflow(prompt, seed, prefix)
    data = json.dumps(wf).encode()
    req = urllib.request.Request(f"{COMFY_API}/prompt", data=data, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read()).get("prompt_id", "")

def collect(prompt_id: str, out_path: str) -> bool:
    try:
        resp = urllib.request.urlopen(f"{COMFY_API}/history/{prompt_id}")
        h = json.loads(resp.read())
        if prompt_id in h:
            imgs = h[prompt_id].get("outputs", {}).get("9", {}).get("images", [])
            if imgs:
                fname = imgs[0]["filename"]
                subprocess.run(["scp", "-q", f"{COMFY_SERVER}:{COMFY_OUTPUT}/{fname}", out_path], check=True)
                return True
    except Exception:
        pass
    return False

# ─── Chess piece definitions ─────────────────────────────────────────
# Each piece: consistent color, material, Staunton style, repeated in every prompt

# Pawn: classic white marble Staunton pawn
PAWN = "a single classic white marble Staunton chess pawn piece, smooth polished white stone, small round head on cylindrical body"
# Queen: elegant black obsidian Staunton queen with crown
QUEEN = "a single elegant black obsidian Staunton chess queen piece, tall with a small crown on top, dark glossy black stone"
# Knight: dark wood Staunton knight with horse head
KNIGHT = "a single dark walnut wood Staunton chess knight piece, carved horse head profile, rich brown wood grain"
# Rook: grey stone Staunton rook with battlements
ROOK = "a single grey granite Staunton chess rook piece, castle tower shape with crenellations on top, solid grey stone"

PIECES = {
    "chess-pawn": {
        "seed": 7001,
        "desc": PAWN,
        "base": f"{PAWN}, centered on frame, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": f"{PAWN}, standing on a checkered chess board square, warm inviting light, Pixar style 3D render, clean white background",
        "learn": f"{PAWN}, positioned next to a tiny open book, studious atmosphere, Pixar style 3D render, clean white background",
        "quiz": f"{PAWN}, under a dramatic single spotlight from above, intense focus, Pixar style 3D render, clean white background",
        "progress": f"{PAWN}, with golden sparkles and confetti around it, celebration moment, Pixar style 3D render, clean white background",
        "options": f"{PAWN}, next to a small metallic gear, settings theme, Pixar style 3D render, clean white background",
    },
    "chess-queen": {
        "seed": 7002,
        "desc": QUEEN,
        "base": f"{QUEEN}, centered on frame, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": f"{QUEEN}, standing tall and commanding on a checkered chess board, regal presence, Pixar style 3D render, clean white background",
        "learn": f"{QUEEN}, positioned next to an ornate open book, royal study, Pixar style 3D render, clean white background",
        "quiz": f"{QUEEN}, under dramatic spotlight, strategic contemplation, Pixar style 3D render, clean white background",
        "progress": f"{QUEEN}, surrounded by golden light rays and sparkles, victorious, Pixar style 3D render, clean white background",
        "options": f"{QUEEN}, next to an ornate metallic gear, refined settings, Pixar style 3D render, clean white background",
    },
    "chess-knight": {
        "seed": 7003,
        "desc": KNIGHT,
        "base": f"{KNIGHT}, centered on frame, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": f"{KNIGHT}, positioned heroically on a checkered chess board, dramatic side angle, Pixar style 3D render, clean white background",
        "learn": f"{KNIGHT}, next to a small open book, study scene, Pixar style 3D render, clean white background",
        "quiz": f"{KNIGHT}, in dramatic profile view, deep in thought atmosphere, Pixar style 3D render, clean white background",
        "progress": f"{KNIGHT}, with a golden laurel wreath draped around it, champion, sparkles, Pixar style 3D render, clean white background",
        "options": f"{KNIGHT}, next to a small gear, workshop setting, Pixar style 3D render, clean white background",
    },
    "chess-rook": {
        "seed": 7004,
        "desc": ROOK,
        "base": f"{ROOK}, centered on frame, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": f"{ROOK}, standing strong on a checkered chess board, fortress energy, Pixar style 3D render, clean white background",
        "learn": f"{ROOK}, next to a tiny open book, study scene, Pixar style 3D render, clean white background",
        "quiz": f"{ROOK}, under dramatic focused lighting, guarding position, Pixar style 3D render, clean white background",
        "progress": f"{ROOK}, with golden sparkles raining down around it, triumphant, Pixar style 3D render, clean white background",
        "options": f"{ROOK}, next to a small gear, configuration theme, Pixar style 3D render, clean white background",
    },
}

POSES = ["home", "learn", "quiz", "progress", "options"]

jobs = []
pending = []

for piece_id, info in PIECES.items():
    seed_base = info["seed"]
    # Base image
    pending.append((info["base"], seed_base * 100, f"chess2_{piece_id}_base", f"{DST}/{piece_id}.png", f"{piece_id} (base)"))
    # Poses — use same seed base with small offsets for consistency
    for i, pose in enumerate(POSES):
        pending.append((info[pose], seed_base * 100 + i + 1, f"chess2_{piece_id}_{pose}", f"{DST}/{piece_id}/{pose}.png", f"{piece_id}/{pose}"))

print(f"=== Submitting {len(pending)} chess piece jobs ===")
sys.stdout.flush()

for i, (prompt, seed, prefix, out_path, label) in enumerate(pending):
    pid = submit(prompt, seed, prefix)
    if pid:
        jobs.append((pid, out_path, label))
        print(f"  [{i+1}/{len(pending)}] Queued: {label}")
    else:
        print(f"  [{i+1}/{len(pending)}] FAILED: {label}")
    sys.stdout.flush()

print(f"\n=== {len(jobs)} jobs queued. Polling... ===")
sys.stdout.flush()

completed = 0
remaining = list(jobs)

while remaining:
    time.sleep(10)
    still_waiting = []
    for pid, out_path, label in remaining:
        if collect(pid, out_path):
            completed += 1
            print(f"  OK [{completed}/{len(jobs)}]: {label}")
            sys.stdout.flush()
        else:
            still_waiting.append((pid, out_path, label))
    remaining = still_waiting
    if remaining:
        print(f"  ... {len(remaining)} remaining")
        sys.stdout.flush()

print(f"\n=== COMPLETE: {completed}/{len(jobs)} chess pieces generated ===")
