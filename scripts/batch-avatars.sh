#!/bin/bash
# Batch generate all avatar pose variants via ComfyUI Flux + PixarPerfect LoRA
# Submits all prompts, then polls and downloads results

COMFY_API="http://10.0.0.239:4455"
COMFY_SERVER="10.0.0.239"
COMFY_OUTPUT="/mnt/tools/comfy-ui/output"
DST="/Users/ralphyz/Tools/spelling_bee/spelling-bee/public/avatars"

submit_prompt() {
  local PROMPT="$1"
  local SEED="$2"
  local PREFIX="$3"

  local PROMPT_JSON
  PROMPT_JSON=$(printf '%s' "$PROMPT" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')

  local WORKFLOW
  WORKFLOW=$(cat <<ENDOFWORKFLOW
{
  "prompt": {
    "12": {
      "class_type": "UNETLoader",
      "inputs": { "unet_name": "flux1-dev.safetensors", "weight_dtype": "default" }
    },
    "11": {
      "class_type": "DualCLIPLoader",
      "inputs": { "clip_name1": "flux/t5xxl_fp16.safetensors", "clip_name2": "flux/clip_l.safetensors", "type": "flux" }
    },
    "10": {
      "class_type": "VAELoader",
      "inputs": { "vae_name": "flux/ae.safetensors" }
    },
    "30": {
      "class_type": "ModelSamplingFlux",
      "inputs": { "model": ["12", 0], "max_shift": 1.15, "base_shift": 0.5, "width": 512, "height": 512 }
    },
    "47": {
      "class_type": "LoraLoader",
      "inputs": { "model": ["30", 0], "clip": ["11", 0], "lora_name": "flux/PixarPerfect_3D_Animation_Style_FLUX-000001.safetensors", "strength_model": 1.0, "strength_clip": 1.0 }
    },
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": { "clip": ["47", 1], "text": $PROMPT_JSON }
    },
    "26": {
      "class_type": "FluxGuidance",
      "inputs": { "conditioning": ["6", 0], "guidance": 3.5 }
    },
    "25": {
      "class_type": "RandomNoise",
      "inputs": { "noise_seed": $SEED }
    },
    "27": {
      "class_type": "EmptySD3LatentImage",
      "inputs": { "width": 512, "height": 512, "batch_size": 1 }
    },
    "16": {
      "class_type": "KSamplerSelect",
      "inputs": { "sampler_name": "euler" }
    },
    "17": {
      "class_type": "BasicScheduler",
      "inputs": { "model": ["30", 0], "scheduler": "beta", "steps": 30, "denoise": 1.0 }
    },
    "22": {
      "class_type": "BasicGuider",
      "inputs": { "model": ["47", 0], "conditioning": ["26", 0] }
    },
    "13": {
      "class_type": "SamplerCustomAdvanced",
      "inputs": { "noise": ["25", 0], "guider": ["22", 0], "sampler": ["16", 0], "sigmas": ["17", 0], "latent_image": ["27", 0] }
    },
    "8": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["13", 0], "vae": ["10", 0] }
    },
    "9": {
      "class_type": "SaveImage",
      "inputs": { "images": ["8", 0], "filename_prefix": "$PREFIX" }
    }
  }
}
ENDOFWORKFLOW
)

  local RESPONSE
  RESPONSE=$(curl -s -X POST "$COMFY_API/prompt" -H "Content-Type: application/json" -d "$WORKFLOW")
  echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt_id',''))" 2>/dev/null
}

collect_result() {
  local PID="$1"
  local OUT="$2"
  local FILE
  FILE=$(curl -s "$COMFY_API/history/$PID" | python3 -c "
import sys, json
h = json.load(sys.stdin)
if '$PID' in h:
    imgs = h['$PID'].get('outputs', {}).get('9', {}).get('images', [])
    if imgs: print(imgs[0]['filename'])
" 2>/dev/null)
  if [ -n "$FILE" ]; then
    scp -q "$COMFY_SERVER:$COMFY_OUTPUT/$FILE" "$OUT"
    echo "OK: $OUT"
    return 0
  fi
  return 1
}

# Track all jobs: "prompt_id|output_path"
JOBS=()

echo "=== Submitting all avatar poses ==="

# Character descriptions and their seeds
declare -A CHARS
CHARS[avocado]="a cute cartoon avocado character cut in half showing the pit, with big expressive eyes and a warm smile"
CHARS[pitbull]="a cute cartoon brown and white pitbull dog with big expressive eyes and floppy ears"
CHARS[elephant]="an adorable cartoon baby elephant with big round expressive eyes and large floppy ears"
CHARS[chess-pawn]="a cute cartoon chess pawn piece character made of smooth white marble with big expressive eyes"
CHARS[chess-queen]="an elegant cartoon chess queen piece character with a golden crown and big expressive eyes"
CHARS[chess-knight]="a cute cartoon chess knight piece character shaped like a horse head with big expressive eyes"
CHARS[chess-rook]="a cute cartoon chess rook castle tower piece character with big expressive eyes"
CHARS[karate-girl]="a cute cartoon young karate girl in a white gi with brown hair in a ponytail and big expressive eyes"
CHARS[girl-brown]="a cute cartoon young girl with brown straight hair with bangs and big brown eyes"
CHARS[girl-blonde]="a cute cartoon young girl with blonde pigtails and big blue eyes"
CHARS[girl-redhead]="a cute cartoon young girl with bright red hair in a ponytail, freckles, and big green eyes"
CHARS[boy-brown]="a cute cartoon young boy with short brown hair and big brown eyes"
CHARS[boy-blonde]="a cute cartoon young boy with short blonde messy hair and big green eyes"
CHARS[boy-black]="a cute cartoon young boy with short black hair and big dark eyes"
CHARS[fire]="a cute cartoon fire flame character with big expressive eyes, vibrant orange and yellow"
CHARS[cat]="a cute cartoon orange tabby cat with big round green eyes and whiskers"
CHARS[tools]="a cute cartoon hammer and wrench tools with big expressive eyes"
CHARS[bbq-ribs]="a cute cartoon rack of BBQ ribs with glistening sauce and big expressive eyes"
CHARS[cross]="a cute cartoon wooden Christian cross with a soft warm glow and gentle expression"
CHARS[wednesday]="a cute cartoon goth girl with long black braids, pale skin, black dress, deadpan expression, Wednesday Addams inspired"
CHARS[dewalt]="a cute cartoon yellow and black DeWalt power drill with big expressive eyes"

declare -A SEEDS
SEEDS[avocado]=4001; SEEDS[pitbull]=4002; SEEDS[elephant]=4003
SEEDS[chess-pawn]=4004; SEEDS[chess-queen]=4005; SEEDS[chess-knight]=4006; SEEDS[chess-rook]=4007
SEEDS[karate-girl]=4008; SEEDS[girl-brown]=4009; SEEDS[girl-blonde]=4010; SEEDS[girl-redhead]=4011
SEEDS[boy-brown]=4012; SEEDS[boy-blonde]=4013; SEEDS[boy-black]=4014
SEEDS[fire]=4015; SEEDS[cat]=4016; SEEDS[tools]=4017; SEEDS[bbq-ribs]=4018
SEEDS[cross]=4019; SEEDS[wednesday]=4020; SEEDS[dewalt]=4021

# Pose suffixes for each page
declare -A POSES
POSES[home]="waving excitedly with one hand raised, big enthusiastic smile, welcoming pose"
POSES[learn]="sitting and reading an open book, focused curious expression, studious pose"
POSES[quiz]="hand on chin in a thinking pose, determined confident expression, pondering"
POSES[progress]="arms raised in celebration, proud triumphant expression, stars and sparkles around"
POSES[options]="holding a gear or wrench, playful tinkering expression, one eyebrow raised"

AVATAR_IDS=(avocado pitbull elephant chess-pawn chess-queen chess-knight chess-rook karate-girl girl-brown girl-blonde girl-redhead boy-brown boy-blonde boy-black fire cat tools bbq-ribs cross wednesday dewalt)

TOTAL=0
for ID in "${AVATAR_IDS[@]}"; do
  CHAR="${CHARS[$ID]}"
  SEED_BASE="${SEEDS[$ID]}"
  POSE_NUM=0
  for PAGE in home learn quiz progress options; do
    POSE="${POSES[$PAGE]}"
    FULL_PROMPT="$CHAR, $POSE, Pixar style 3D character render, clean white background"
    SEED=$((SEED_BASE * 100 + POSE_NUM))
    PREFIX="avatar_${ID}_${PAGE}"
    OUT_PATH="$DST/$ID/$PAGE.png"

    PID=$(submit_prompt "$FULL_PROMPT" "$SEED" "$PREFIX")
    if [ -n "$PID" ]; then
      JOBS+=("$PID|$OUT_PATH")
      TOTAL=$((TOTAL + 1))
      echo "[$TOTAL] Queued: $ID/$PAGE (seed=$SEED, pid=${PID:0:8}...)"
    else
      echo "FAILED to queue: $ID/$PAGE"
    fi
    POSE_NUM=$((POSE_NUM + 1))
  done
done

echo ""
echo "=== $TOTAL jobs queued. Waiting for completion... ==="

# Poll until all done
COMPLETED=0
FAILED_JOBS=()
MAX_WAIT=600  # 10 minutes per check cycle
CHECK_INTERVAL=10

while [ ${#JOBS[@]} -gt 0 ]; do
  sleep $CHECK_INTERVAL
  REMAINING=()
  for JOB in "${JOBS[@]}"; do
    PID="${JOB%%|*}"
    OUT="${JOB##*|}"
    if collect_result "$PID" "$OUT"; then
      COMPLETED=$((COMPLETED + 1))
      echo "  [$COMPLETED/$TOTAL] done"
    else
      REMAINING+=("$JOB")
    fi
  done
  JOBS=("${REMAINING[@]}")

  if [ ${#JOBS[@]} -gt 0 ]; then
    echo "  ... ${#JOBS[@]} remaining"
  fi
done

echo ""
echo "=== COMPLETE: $COMPLETED/$TOTAL avatars generated ==="
