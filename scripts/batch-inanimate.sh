#!/bin/bash
# Regenerate inanimate avatars with more sophisticated Pixar prop style
# No cartoon faces - just beautiful high-quality 3D renders

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
    "12": { "class_type": "UNETLoader", "inputs": { "unet_name": "flux1-dev.safetensors", "weight_dtype": "default" } },
    "11": { "class_type": "DualCLIPLoader", "inputs": { "clip_name1": "flux/t5xxl_fp16.safetensors", "clip_name2": "flux/clip_l.safetensors", "type": "flux" } },
    "10": { "class_type": "VAELoader", "inputs": { "vae_name": "flux/ae.safetensors" } },
    "30": { "class_type": "ModelSamplingFlux", "inputs": { "model": ["12", 0], "max_shift": 1.15, "base_shift": 0.5, "width": 512, "height": 512 } },
    "47": { "class_type": "LoraLoader", "inputs": { "model": ["30", 0], "clip": ["11", 0], "lora_name": "flux/PixarPerfect_3D_Animation_Style_FLUX-000001.safetensors", "strength_model": 1.0, "strength_clip": 1.0 } },
    "6": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["47", 1], "text": $PROMPT_JSON } },
    "26": { "class_type": "FluxGuidance", "inputs": { "conditioning": ["6", 0], "guidance": 3.5 } },
    "25": { "class_type": "RandomNoise", "inputs": { "noise_seed": $SEED } },
    "27": { "class_type": "EmptySD3LatentImage", "inputs": { "width": 512, "height": 512, "batch_size": 1 } },
    "16": { "class_type": "KSamplerSelect", "inputs": { "sampler_name": "euler" } },
    "17": { "class_type": "BasicScheduler", "inputs": { "model": ["30", 0], "scheduler": "beta", "steps": 30, "denoise": 1.0 } },
    "22": { "class_type": "BasicGuider", "inputs": { "model": ["47", 0], "conditioning": ["26", 0] } },
    "13": { "class_type": "SamplerCustomAdvanced", "inputs": { "noise": ["25", 0], "guider": ["22", 0], "sampler": ["16", 0], "sigmas": ["17", 0], "latent_image": ["27", 0] } },
    "8": { "class_type": "VAEDecode", "inputs": { "samples": ["13", 0], "vae": ["10", 0] } },
    "9": { "class_type": "SaveImage", "inputs": { "images": ["8", 0], "filename_prefix": "$PREFIX" } }
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

JOBS=()
TOTAL=0

echo "=== Submitting inanimate avatar regeneration ==="

# Each avatar: base description for each context, no anthropomorphic faces
# Format: ID|SEED|BASE_DESC|HOME_DESC|LEARN_DESC|QUIZ_DESC|PROGRESS_DESC|OPTIONS_DESC

declare -A BASE BHOME BLEARN BQUIZ BPROG BOPTS SEEDS

SEEDS[avocado]=5001
BASE[avocado]="a perfectly ripe avocado cut in half showing the pit, rich green flesh, beautiful food photography"
BHOME[avocado]="a perfectly ripe avocado cut in half, vibrant and fresh, presented upright on a tiny stage, dramatic spotlight, Pixar style 3D render, clean white background"
BLEARN[avocado]="a perfectly ripe avocado cut in half propped up next to a small open book, cozy study scene, Pixar style 3D render, clean white background"
BQUIZ[avocado]="a perfectly ripe avocado cut in half with a tiny pencil leaning against it, quiz time mood, Pixar style 3D render, clean white background"
BPROG[avocado]="a perfectly ripe avocado cut in half with golden sparkles and a tiny trophy beside it, celebration, Pixar style 3D render, clean white background"
BOPTS[avocado]="a perfectly ripe avocado cut in half next to a small gear icon, settings vibe, Pixar style 3D render, clean white background"

SEEDS[chess-pawn]=5004
BASE[chess-pawn]="a polished marble chess pawn piece, elegant and classic, dramatic lighting, Pixar style 3D render"
BHOME[chess-pawn]="a polished marble chess pawn on a checkered surface, ready for action, dramatic lighting, Pixar style 3D render, clean white background"
BLEARN[chess-pawn]="a polished marble chess pawn next to a tiny open book on a chess board, studious scene, Pixar style 3D render, clean white background"
BQUIZ[chess-pawn]="a polished marble chess pawn in a dramatic thinking position, spotlight from above, strategic mood, Pixar style 3D render, clean white background"
BPROG[chess-pawn]="a polished marble chess pawn with a golden crown floating above it, promotion celebration, sparkles, Pixar style 3D render, clean white background"
BOPTS[chess-pawn]="a polished marble chess pawn next to a small gear, customization theme, Pixar style 3D render, clean white background"

SEEDS[chess-queen]=5005
BASE[chess-queen]="a regal marble chess queen piece with golden accents, elegant and powerful, dramatic lighting, Pixar style 3D render"
BHOME[chess-queen]="a regal marble chess queen piece with golden accents standing tall, commanding presence, dramatic lighting, Pixar style 3D render, clean white background"
BLEARN[chess-queen]="a regal marble chess queen piece next to an ornate open book, royal study, Pixar style 3D render, clean white background"
BQUIZ[chess-queen]="a regal marble chess queen piece under a dramatic spotlight, strategic contemplation, Pixar style 3D render, clean white background"
BPROG[chess-queen]="a regal marble chess queen piece surrounded by golden light and sparkles, victorious, Pixar style 3D render, clean white background"
BOPTS[chess-queen]="a regal marble chess queen piece next to an ornate gear, refined settings, Pixar style 3D render, clean white background"

SEEDS[chess-knight]=5006
BASE[chess-knight]="a polished marble chess knight piece, detailed horse head carving, dramatic lighting, Pixar style 3D render"
BHOME[chess-knight]="a polished marble chess knight piece rearing up heroically, dramatic lighting, Pixar style 3D render, clean white background"
BLEARN[chess-knight]="a polished marble chess knight piece next to a small open book, study scene, Pixar style 3D render, clean white background"
BQUIZ[chess-knight]="a polished marble chess knight piece in dramatic side profile, deep in thought, Pixar style 3D render, clean white background"
BPROG[chess-knight]="a polished marble chess knight piece with a golden laurel wreath, champion, sparkles, Pixar style 3D render, clean white background"
BOPTS[chess-knight]="a polished marble chess knight piece next to a small gear, Pixar style 3D render, clean white background"

SEEDS[chess-rook]=5007
BASE[chess-rook]="a polished marble chess rook castle piece, strong and solid, dramatic lighting, Pixar style 3D render"
BHOME[chess-rook]="a polished marble chess rook castle piece standing strong, fortress energy, dramatic lighting, Pixar style 3D render, clean white background"
BLEARN[chess-rook]="a polished marble chess rook castle piece next to a tiny open book, Pixar style 3D render, clean white background"
BQUIZ[chess-rook]="a polished marble chess rook castle piece under dramatic lighting, guarding position, Pixar style 3D render, clean white background"
BPROG[chess-rook]="a polished marble chess rook castle piece with golden sparkles raining down, triumphant, Pixar style 3D render, clean white background"
BOPTS[chess-rook]="a polished marble chess rook castle piece next to a small gear, Pixar style 3D render, clean white background"

SEEDS[fire]=5015
BASE[fire]="a beautiful stylized flame, vibrant orange yellow and red, dynamic and alive, Pixar style 3D render"
BHOME[fire]="a vibrant stylized flame burning bright and tall, energetic and inviting, dynamic pose, Pixar style 3D render, clean white background"
BLEARN[fire]="a warm gentle flame hovering over an open book, illuminating the pages, cozy study atmosphere, Pixar style 3D render, clean white background"
BQUIZ[fire]="an intense focused flame burning with determination, blue-hot center, concentrated energy, Pixar style 3D render, clean white background"
BPROG[fire]="a magnificent flame erupting upward with golden sparks flying, celebration fireworks, Pixar style 3D render, clean white background"
BOPTS[fire]="a warm flame next to a metallic gear, tinkering warmth, Pixar style 3D render, clean white background"

SEEDS[tools]=5017
BASE[tools]="a well-worn hammer and wrench crossed together, quality craftsman tools, warm lighting, Pixar style 3D render"
BHOME[tools]="a quality hammer and wrench crossed together standing upright, ready for work, warm workshop lighting, Pixar style 3D render, clean white background"
BLEARN[tools]="a hammer and wrench laid next to an open technical manual, workshop study, Pixar style 3D render, clean white background"
BQUIZ[tools]="a hammer and wrench in a precise measuring arrangement, careful precision, Pixar style 3D render, clean white background"
BPROG[tools]="a hammer and wrench with a golden medal draped over them, master craftsman achievement, sparkles, Pixar style 3D render, clean white background"
BOPTS[tools]="a hammer and wrench next to gears and bolts, workshop settings, Pixar style 3D render, clean white background"

SEEDS[bbq-ribs]=5018
BASE[bbq-ribs]="a gorgeous rack of BBQ ribs with glistening sauce and perfect char marks, food photography, Pixar style 3D render"
BHOME[bbq-ribs]="a gorgeous rack of BBQ ribs with glistening sauce, steam rising, presented on a wooden board, Pixar style 3D render, clean white background"
BLEARN[bbq-ribs]="a rack of BBQ ribs on a cutting board next to an open recipe book, culinary study, Pixar style 3D render, clean white background"
BQUIZ[bbq-ribs]="a rack of BBQ ribs with a meat thermometer checking temperature precisely, Pixar style 3D render, clean white background"
BPROG[bbq-ribs]="a rack of BBQ ribs with a blue ribbon first place award, competition winner, golden sparkles, Pixar style 3D render, clean white background"
BOPTS[bbq-ribs]="a rack of BBQ ribs next to bottles of different sauces and seasonings, customization, Pixar style 3D render, clean white background"

SEEDS[cross]=5019
BASE[cross]="a beautiful wooden cross with warm light radiating softly, reverent and peaceful, Pixar style 3D render"
BHOME[cross]="a beautiful wooden cross with warm golden light radiating outward, peaceful and welcoming, Pixar style 3D render, clean white background"
BLEARN[cross]="a beautiful wooden cross next to an open Bible with soft warm light, peaceful study, Pixar style 3D render, clean white background"
BQUIZ[cross]="a beautiful wooden cross with a soft contemplative glow, quiet reflection, Pixar style 3D render, clean white background"
BPROG[cross]="a beautiful wooden cross with radiant golden light beaming outward, glorious and triumphant, Pixar style 3D render, clean white background"
BOPTS[cross]="a beautiful wooden cross with soft ambient light, serene, Pixar style 3D render, clean white background"

SEEDS[dewalt]=5021
BASE[dewalt]="a DeWalt 20V power drill, yellow and black, professional quality, product photography, Pixar style 3D render"
BHOME[dewalt]="a DeWalt 20V power drill standing upright, yellow and black, ready for action, dramatic product lighting, Pixar style 3D render, clean white background"
BLEARN[dewalt]="a DeWalt power drill laid next to an open instruction manual, learning the craft, Pixar style 3D render, clean white background"
BQUIZ[dewalt]="a DeWalt power drill with a precision drill bit, laser-focused accuracy, Pixar style 3D render, clean white background"
BPROG[dewalt]="a DeWalt power drill with a golden star badge and sparkles, top rated tool, Pixar style 3D render, clean white background"
BOPTS[dewalt]="a DeWalt power drill surrounded by different drill bits and attachments, customization options, Pixar style 3D render, clean white background"

AVATAR_IDS=(avocado chess-pawn chess-queen chess-knight chess-rook fire tools bbq-ribs cross dewalt)

for ID in "${AVATAR_IDS[@]}"; do
  SEED_BASE="${SEEDS[$ID]}"

  # Base avatar
  PID=$(submit_prompt "${BHOME[$ID]}" "$((SEED_BASE * 100))" "inan_${ID}_base")
  if [ -n "$PID" ]; then
    JOBS+=("$PID|$DST/$ID.png")
    TOTAL=$((TOTAL + 1))
    echo "[$TOTAL] Queued: $ID (base)"
  fi

  # Poses
  POSE_NUM=0
  for PAGE in home learn quiz progress options; do
    local_var="B$(echo $PAGE | tr '[:lower:]' '[:upper:]')"
    # Use indirect reference
    eval "PROMPT=\${$local_var[$ID]}"
    SEED=$((SEED_BASE * 100 + POSE_NUM))
    PID=$(submit_prompt "$PROMPT" "$SEED" "inan_${ID}_${PAGE}")
    if [ -n "$PID" ]; then
      JOBS+=("$PID|$DST/$ID/$PAGE.png")
      TOTAL=$((TOTAL + 1))
      echo "[$TOTAL] Queued: $ID/$PAGE"
    fi
    POSE_NUM=$((POSE_NUM + 1))
  done
done

echo ""
echo "=== $TOTAL jobs queued. Waiting for completion... ==="

COMPLETED=0
while [ ${#JOBS[@]} -gt 0 ]; do
  sleep 10
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
echo "=== COMPLETE: $COMPLETED/$TOTAL inanimate avatars regenerated ==="
