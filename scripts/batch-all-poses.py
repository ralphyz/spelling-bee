#!/usr/bin/env python3
"""Regenerate ALL avatar pose images via ComfyUI Flux + PixarPerfect LoRA.
Submits all prompts in parallel, then polls for completion.
"""

import json, time, subprocess, sys, urllib.request, urllib.parse

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

# ─── Avatar definitions ───────────────────────────────────────────────

AVATARS = {
    # ── Inanimate (need base + poses) ──
    "avocado": {
        "seed": 5001,
        "base": "a perfectly ripe avocado cut in half showing the pit, rich green flesh, beautiful food photography, Pixar style 3D render, clean white background",
        "home": "a perfectly ripe avocado cut in half, vibrant and fresh, presented upright on a tiny stage, dramatic spotlight, Pixar style 3D render, clean white background",
        "learn": "a perfectly ripe avocado cut in half propped up next to a small open book, cozy study scene, Pixar style 3D render, clean white background",
        "quiz": "a perfectly ripe avocado cut in half with a tiny pencil leaning against it, quiz time mood, Pixar style 3D render, clean white background",
        "progress": "a perfectly ripe avocado cut in half with golden sparkles and a tiny trophy beside it, celebration, Pixar style 3D render, clean white background",
        "options": "a perfectly ripe avocado cut in half next to a small gear icon, settings vibe, Pixar style 3D render, clean white background",
    },
    "chess-pawn": {
        "seed": 770001,
        "base": "a single classic white marble Staunton chess pawn piece, smooth polished white stone, small round head on cylindrical body, centered, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": "a single classic white marble Staunton chess pawn piece, smooth polished white stone, small round head on cylindrical body, standing on a checkered chess board square, warm inviting light, Pixar style 3D render, clean white background",
        "learn": "a single classic white marble Staunton chess pawn piece, smooth polished white stone, small round head on cylindrical body, positioned next to a tiny open book, studious atmosphere, Pixar style 3D render, clean white background",
        "quiz": "a single classic white marble Staunton chess pawn piece, smooth polished white stone, small round head on cylindrical body, under a dramatic single spotlight from above, intense focus, Pixar style 3D render, clean white background",
        "progress": "a single classic white marble Staunton chess pawn piece, smooth polished white stone, small round head on cylindrical body, with golden sparkles and confetti around it, celebration, Pixar style 3D render, clean white background",
        "options": "a single classic white marble Staunton chess pawn piece, smooth polished white stone, small round head on cylindrical body, next to a small metallic gear, settings theme, Pixar style 3D render, clean white background",
    },
    "chess-queen": {
        "seed": 770002,
        "base": "a single elegant black obsidian Staunton chess queen piece, tall with a small crown on top, dark glossy black stone, centered, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": "a single elegant black obsidian Staunton chess queen piece, tall with a small crown on top, dark glossy black stone, standing tall and commanding on a checkered chess board, regal presence, Pixar style 3D render, clean white background",
        "learn": "a single elegant black obsidian Staunton chess queen piece, tall with a small crown on top, dark glossy black stone, positioned next to an ornate open book, royal study, Pixar style 3D render, clean white background",
        "quiz": "a single elegant black obsidian Staunton chess queen piece, tall with a small crown on top, dark glossy black stone, under dramatic spotlight, strategic contemplation, Pixar style 3D render, clean white background",
        "progress": "a single elegant black obsidian Staunton chess queen piece, tall with a small crown on top, dark glossy black stone, surrounded by golden light rays and sparkles, victorious, Pixar style 3D render, clean white background",
        "options": "a single elegant black obsidian Staunton chess queen piece, tall with a small crown on top, dark glossy black stone, next to an ornate metallic gear, refined settings, Pixar style 3D render, clean white background",
    },
    "chess-knight": {
        "seed": 770003,
        "base": "a single dark walnut wood Staunton chess knight piece, carved horse head profile, rich brown wood grain, centered, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": "a single dark walnut wood Staunton chess knight piece, carved horse head profile, rich brown wood grain, positioned heroically on a checkered chess board, dramatic side angle, Pixar style 3D render, clean white background",
        "learn": "a single dark walnut wood Staunton chess knight piece, carved horse head profile, rich brown wood grain, next to a small open book, study scene, Pixar style 3D render, clean white background",
        "quiz": "a single dark walnut wood Staunton chess knight piece, carved horse head profile, rich brown wood grain, in dramatic profile view, deep in thought atmosphere, Pixar style 3D render, clean white background",
        "progress": "a single dark walnut wood Staunton chess knight piece, carved horse head profile, rich brown wood grain, with a golden laurel wreath draped around it, champion, sparkles, Pixar style 3D render, clean white background",
        "options": "a single dark walnut wood Staunton chess knight piece, carved horse head profile, rich brown wood grain, next to a small gear, workshop setting, Pixar style 3D render, clean white background",
    },
    "chess-rook": {
        "seed": 770004,
        "base": "a single grey granite Staunton chess rook piece, castle tower shape with crenellations on top, solid grey stone, centered, dramatic studio lighting, Pixar style 3D render, clean white background",
        "home": "a single grey granite Staunton chess rook piece, castle tower shape with crenellations on top, solid grey stone, standing strong on a checkered chess board, fortress energy, Pixar style 3D render, clean white background",
        "learn": "a single grey granite Staunton chess rook piece, castle tower shape with crenellations on top, solid grey stone, next to a tiny open book, study scene, Pixar style 3D render, clean white background",
        "quiz": "a single grey granite Staunton chess rook piece, castle tower shape with crenellations on top, solid grey stone, under dramatic focused lighting, guarding position, Pixar style 3D render, clean white background",
        "progress": "a single grey granite Staunton chess rook piece, castle tower shape with crenellations on top, solid grey stone, with golden sparkles raining down around it, triumphant, Pixar style 3D render, clean white background",
        "options": "a single grey granite Staunton chess rook piece, castle tower shape with crenellations on top, solid grey stone, next to a small gear, configuration theme, Pixar style 3D render, clean white background",
    },
    "fire": {
        "seed": 5015,
        "base": "a beautiful stylized flame, vibrant orange yellow and red, dynamic and alive, Pixar style 3D render, clean white background",
        "home": "a vibrant stylized flame burning bright and tall, energetic and inviting, dynamic pose, Pixar style 3D render, clean white background",
        "learn": "a warm gentle flame hovering over an open book, illuminating the pages, cozy study atmosphere, Pixar style 3D render, clean white background",
        "quiz": "an intense focused flame burning with determination, blue-hot center, concentrated energy, Pixar style 3D render, clean white background",
        "progress": "a magnificent flame erupting upward with golden sparks flying, celebration fireworks, Pixar style 3D render, clean white background",
        "options": "a warm flame next to a metallic gear, tinkering warmth, Pixar style 3D render, clean white background",
    },
    "tools": {
        "seed": 5017,
        "base": "a well-worn hammer and wrench crossed together, quality craftsman tools, warm lighting, Pixar style 3D render, clean white background",
        "home": "a quality hammer and wrench crossed together standing upright, ready for work, warm workshop lighting, Pixar style 3D render, clean white background",
        "learn": "a hammer and wrench laid next to an open technical manual, workshop study, Pixar style 3D render, clean white background",
        "quiz": "a hammer and wrench in a precise measuring arrangement, careful precision, Pixar style 3D render, clean white background",
        "progress": "a hammer and wrench with a golden medal draped over them, master craftsman achievement, sparkles, Pixar style 3D render, clean white background",
        "options": "a hammer and wrench next to gears and bolts, workshop settings, Pixar style 3D render, clean white background",
    },
    "bbq-ribs": {
        "seed": 5018,
        "base": "a gorgeous rack of BBQ ribs with glistening sauce and perfect char marks, food photography, Pixar style 3D render, clean white background",
        "home": "a gorgeous rack of BBQ ribs with glistening sauce, steam rising, presented on a wooden board, Pixar style 3D render, clean white background",
        "learn": "a rack of BBQ ribs on a cutting board next to an open recipe book, culinary study, Pixar style 3D render, clean white background",
        "quiz": "a rack of BBQ ribs with a meat thermometer checking temperature precisely, Pixar style 3D render, clean white background",
        "progress": "a rack of BBQ ribs with a blue ribbon first place award, competition winner, golden sparkles, Pixar style 3D render, clean white background",
        "options": "a rack of BBQ ribs next to bottles of different sauces and seasonings, customization, Pixar style 3D render, clean white background",
    },
    "cross": {
        "seed": 5019,
        "base": "a beautiful wooden cross with warm light radiating softly, reverent and peaceful, Pixar style 3D render, clean white background",
        "home": "a beautiful wooden cross with warm golden light radiating outward, peaceful and welcoming, Pixar style 3D render, clean white background",
        "learn": "a beautiful wooden cross next to an open Bible with soft warm light, peaceful study, Pixar style 3D render, clean white background",
        "quiz": "a beautiful wooden cross with a soft contemplative glow, quiet reflection, Pixar style 3D render, clean white background",
        "progress": "a beautiful wooden cross with radiant golden light beaming outward, glorious and triumphant, Pixar style 3D render, clean white background",
        "options": "a beautiful wooden cross with soft ambient light, serene, Pixar style 3D render, clean white background",
    },
    "dewalt": {
        "seed": 5021,
        "base": "a DeWalt 20V power drill, yellow and black, professional quality, product photography, Pixar style 3D render, clean white background",
        "home": "a DeWalt 20V power drill standing upright, yellow and black, ready for action, dramatic product lighting, Pixar style 3D render, clean white background",
        "learn": "a DeWalt power drill laid next to an open instruction manual, learning the craft, Pixar style 3D render, clean white background",
        "quiz": "a DeWalt power drill with a precision drill bit, laser-focused accuracy, Pixar style 3D render, clean white background",
        "progress": "a DeWalt power drill with a golden star badge and sparkles, top rated tool, Pixar style 3D render, clean white background",
        "options": "a DeWalt power drill surrounded by different drill bits and attachments, customization options, Pixar style 3D render, clean white background",
    },
    # ── Animate (only need poses, base images are fine) ──
    "elephant": {
        "seed": 4003,
        "home": "a cute baby elephant in Pixar 3D animation style, sitting and waving with trunk raised, happy expression, clean white background",
        "learn": "a cute baby elephant in Pixar 3D animation style, sitting and reading a book with glasses, studious, clean white background",
        "quiz": "a cute baby elephant in Pixar 3D animation style, thinking with trunk on chin, puzzled expression, clean white background",
        "progress": "a cute baby elephant in Pixar 3D animation style, jumping for joy with trunk raised high, celebrating with sparkles, clean white background",
        "options": "a cute baby elephant in Pixar 3D animation style, holding a wrench and tinkering, curious expression, clean white background",
    },
    "pitbull": {
        "seed": 4002,
        "home": "a friendly pitbull dog in Pixar 3D animation style, sitting and panting happily, muscular and cute, clean white background",
        "learn": "a friendly pitbull dog in Pixar 3D animation style, wearing reading glasses looking at a book, studious, clean white background",
        "quiz": "a friendly pitbull dog in Pixar 3D animation style, head tilted quizzically, thinking, clean white background",
        "progress": "a friendly pitbull dog in Pixar 3D animation style, standing proud with a medal, tail wagging, celebrating, clean white background",
        "options": "a friendly pitbull dog in Pixar 3D animation style, pawing at a gear, playful and curious, clean white background",
    },
    "cat": {
        "seed": 4016,
        "home": "a fluffy orange tabby cat in Pixar 3D animation style, sitting with tail curled, warm and welcoming, clean white background",
        "learn": "a fluffy orange tabby cat in Pixar 3D animation style, lying next to an open book, curious and studious, clean white background",
        "quiz": "a fluffy orange tabby cat in Pixar 3D animation style, squinting thoughtfully, paw on chin, clean white background",
        "progress": "a fluffy orange tabby cat in Pixar 3D animation style, leaping with joy, sparkles around, celebrating, clean white background",
        "options": "a fluffy orange tabby cat in Pixar 3D animation style, batting at a gear toy, playful, clean white background",
    },
    "karate-girl": {
        "seed": 4008,
        "home": "a young girl in karate uniform doing a confident pose in Pixar 3D animation style, ready stance, clean white background",
        "learn": "a young girl in karate uniform sitting cross-legged reading a book in Pixar 3D animation style, focused, clean white background",
        "quiz": "a young girl in karate uniform in a thinking pose in Pixar 3D animation style, hand on chin, clean white background",
        "progress": "a young girl in karate uniform doing a victory kick in Pixar 3D animation style, black belt, celebrating, sparkles, clean white background",
        "options": "a young girl in karate uniform adjusting her belt in Pixar 3D animation style, getting ready, clean white background",
    },
    "girl-brown": {
        "seed": 4009,
        "home": "a young girl with brown hair and brown skin in Pixar 3D animation style, waving hello, friendly smile, clean white background",
        "learn": "a young girl with brown hair and brown skin in Pixar 3D animation style, reading a book at a desk, studious, clean white background",
        "quiz": "a young girl with brown hair and brown skin in Pixar 3D animation style, thinking with finger on chin, clean white background",
        "progress": "a young girl with brown hair and brown skin in Pixar 3D animation style, jumping with hands up celebrating, sparkles, clean white background",
        "options": "a young girl with brown hair and brown skin in Pixar 3D animation style, holding a paintbrush, creative, clean white background",
    },
    "girl-blonde": {
        "seed": 4010,
        "home": "a young girl with blonde hair in Pixar 3D animation style, waving hello, bright smile, clean white background",
        "learn": "a young girl with blonde hair in Pixar 3D animation style, reading a book with glasses, studious, clean white background",
        "quiz": "a young girl with blonde hair in Pixar 3D animation style, thinking with pencil, quizzical look, clean white background",
        "progress": "a young girl with blonde hair in Pixar 3D animation style, cheering with arms raised, celebrating, sparkles, clean white background",
        "options": "a young girl with blonde hair in Pixar 3D animation style, holding a gear, tinkering, clean white background",
    },
    "girl-redhead": {
        "seed": 4011,
        "home": "a young girl with red hair in a ponytail in Pixar 3D animation style, waving hello, friendly, clean white background",
        "learn": "a young girl with red hair in a ponytail in Pixar 3D animation style, reading a big book, focused, clean white background",
        "quiz": "a young girl with red hair in a ponytail in Pixar 3D animation style, scratching head thinking, puzzled, clean white background",
        "progress": "a young girl with red hair in a ponytail in Pixar 3D animation style, doing a happy dance, celebrating, sparkles, clean white background",
        "options": "a young girl with red hair in a ponytail in Pixar 3D animation style, holding tools, creative, clean white background",
    },
    "boy-brown": {
        "seed": 4012,
        "home": "a young boy with brown hair in Pixar 3D animation style, waving hello, confident smile, clean white background",
        "learn": "a young boy with brown hair in Pixar 3D animation style, sitting and reading a book, studious, clean white background",
        "quiz": "a young boy with brown hair in Pixar 3D animation style, hand on chin thinking, clean white background",
        "progress": "a young boy with brown hair in Pixar 3D animation style, fist pump celebrating victory, sparkles, clean white background",
        "options": "a young boy with brown hair in Pixar 3D animation style, holding a wrench, tinkering, clean white background",
    },
    "boy-blonde": {
        "seed": 4013,
        "home": "a young boy with blonde hair in Pixar 3D animation style, waving hello, cheerful, clean white background",
        "learn": "a young boy with blonde hair in Pixar 3D animation style, reading at a desk, studious, clean white background",
        "quiz": "a young boy with blonde hair in Pixar 3D animation style, looking up thinking, pencil behind ear, clean white background",
        "progress": "a young boy with blonde hair in Pixar 3D animation style, jumping with joy, arms raised, celebrating, sparkles, clean white background",
        "options": "a young boy with blonde hair in Pixar 3D animation style, adjusting glasses, thoughtful, clean white background",
    },
    "boy-black": {
        "seed": 4014,
        "home": "a young boy with black hair and dark skin in Pixar 3D animation style, waving hello, warm smile, clean white background",
        "learn": "a young boy with black hair and dark skin in Pixar 3D animation style, reading a book, focused, clean white background",
        "quiz": "a young boy with black hair and dark skin in Pixar 3D animation style, thinking pose with arms crossed, clean white background",
        "progress": "a young boy with black hair and dark skin in Pixar 3D animation style, celebrating with medal, sparkles, clean white background",
        "options": "a young boy with black hair and dark skin in Pixar 3D animation style, holding a gear, curious, clean white background",
    },
    "wednesday": {
        "seed": 4020,
        "home": "Wednesday Addams as a young girl in Pixar 3D animation style, dark braids, black dress, stoic expression, standing with arms at sides, clean white background",
        "learn": "Wednesday Addams as a young girl in Pixar 3D animation style, dark braids, reading a dark gothic book, focused, clean white background",
        "quiz": "Wednesday Addams as a young girl in Pixar 3D animation style, dark braids, one eyebrow raised quizzically, thinking, clean white background",
        "progress": "Wednesday Addams as a young girl in Pixar 3D animation style, dark braids, slight smirk of satisfaction, subtle sparkles, clean white background",
        "options": "Wednesday Addams as a young girl in Pixar 3D animation style, dark braids, examining a potion bottle, curious, clean white background",
    },
}

POSES = ["home", "learn", "quiz", "progress", "options"]

# ─── Build job list ───────────────────────────────────────────────────

jobs = []  # (prompt_id, output_path, label)
pending = []  # (prompt, seed, prefix, output_path, label) - to submit

for avatar_id, info in AVATARS.items():
    seed_base = info["seed"]

    # Use SAME seed for all poses of a given avatar — keeps character consistent
    seed = seed_base

    # Base image (only for inanimate avatars that have a "base" key)
    if "base" in info:
        pending.append((
            info["base"],
            seed,
            f"regen_{avatar_id}_base",
            f"{DST}/{avatar_id}.png",
            f"{avatar_id} (base)",
        ))

    # Pose images — same seed, only prompt changes
    for i, pose in enumerate(POSES):
        if pose in info:
            pending.append((
                info[pose],
                seed,
                f"regen_{avatar_id}_{pose}",
                f"{DST}/{avatar_id}/{pose}.png",
                f"{avatar_id}/{pose}",
            ))

print(f"=== Submitting {len(pending)} image generation jobs ===")
sys.stdout.flush()

for i, (prompt, seed, prefix, out_path, label) in enumerate(pending):
    pid = submit(prompt, seed, prefix)
    if pid:
        jobs.append((pid, out_path, label))
        print(f"  [{i+1}/{len(pending)}] Queued: {label}")
    else:
        print(f"  [{i+1}/{len(pending)}] FAILED to queue: {label}")
    sys.stdout.flush()

print(f"\n=== {len(jobs)} jobs queued. Polling for completion... ===")
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

print(f"\n=== COMPLETE: {completed}/{len(jobs)} images generated ===")
