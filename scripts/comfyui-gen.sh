#!/bin/bash
# Generate an image via ComfyUI Flux + PixarPerfect LoRA
# Usage: ./comfyui-gen.sh "prompt text" output_filename.png

COMFY_API="http://10.0.0.239:4455"
COMFY_SERVER="10.0.0.239"
COMFY_OUTPUT="/mnt/tools/comfy-ui/output"
PROMPT="$1"
OUTPUT_FILE="$2"
PREFIX="spelling_bee_avatar"

if [ -z "$PROMPT" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Usage: $0 'prompt text' output_filename.png"
  exit 1
fi

# Build the API workflow JSON
WORKFLOW=$(cat <<ENDOFWORKFLOW
{
  "prompt": {
    "12": {
      "class_type": "UNETLoader",
      "inputs": {
        "unet_name": "flux1-dev.safetensors",
        "weight_dtype": "default"
      }
    },
    "11": {
      "class_type": "DualCLIPLoader",
      "inputs": {
        "clip_name1": "flux/t5xxl_fp16.safetensors",
        "clip_name2": "flux/clip_l.safetensors",
        "type": "flux"
      }
    },
    "10": {
      "class_type": "VAELoader",
      "inputs": {
        "vae_name": "flux/ae.safetensors"
      }
    },
    "30": {
      "class_type": "ModelSamplingFlux",
      "inputs": {
        "model": ["12", 0],
        "max_shift": 1.15,
        "base_shift": 0.5,
        "width": 512,
        "height": 512
      }
    },
    "47": {
      "class_type": "LoraLoader",
      "inputs": {
        "model": ["30", 0],
        "clip": ["11", 0],
        "lora_name": "flux/PixarPerfect_3D_Animation_Style_FLUX-000001.safetensors",
        "strength_model": 1.0,
        "strength_clip": 1.0
      }
    },
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["47", 1],
        "text": $(printf '%s' "$PROMPT" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')
      }
    },
    "26": {
      "class_type": "FluxGuidance",
      "inputs": {
        "conditioning": ["6", 0],
        "guidance": 3.5
      }
    },
    "25": {
      "class_type": "RandomNoise",
      "inputs": {
        "noise_seed": $((RANDOM * RANDOM))
      }
    },
    "27": {
      "class_type": "EmptySD3LatentImage",
      "inputs": {
        "width": 512,
        "height": 512,
        "batch_size": 1
      }
    },
    "16": {
      "class_type": "KSamplerSelect",
      "inputs": {
        "sampler_name": "euler"
      }
    },
    "17": {
      "class_type": "BasicScheduler",
      "inputs": {
        "model": ["30", 0],
        "scheduler": "beta",
        "steps": 30,
        "denoise": 1.0
      }
    },
    "22": {
      "class_type": "BasicGuider",
      "inputs": {
        "model": ["47", 0],
        "conditioning": ["26", 0]
      }
    },
    "13": {
      "class_type": "SamplerCustomAdvanced",
      "inputs": {
        "noise": ["25", 0],
        "guider": ["22", 0],
        "sampler": ["16", 0],
        "sigmas": ["17", 0],
        "latent_image": ["27", 0]
      }
    },
    "8": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["13", 0],
        "vae": ["10", 0]
      }
    },
    "9": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["8", 0],
        "filename_prefix": "$PREFIX"
      }
    }
  }
}
ENDOFWORKFLOW
)

echo "Submitting prompt: $PROMPT"
RESPONSE=$(curl -s -X POST "$COMFY_API/prompt" \
  -H "Content-Type: application/json" \
  -d "$WORKFLOW")

PROMPT_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt_id',''))" 2>/dev/null)

if [ -z "$PROMPT_ID" ]; then
  echo "ERROR: Failed to submit prompt"
  echo "$RESPONSE"
  exit 1
fi

echo "Prompt ID: $PROMPT_ID"
echo "Waiting for generation..."

# Poll for completion
for i in $(seq 1 120); do
  sleep 2
  HISTORY=$(curl -s "$COMFY_API/history/$PROMPT_ID")
  STATUS=$(echo "$HISTORY" | python3 -c "
import sys, json
h = json.load(sys.stdin)
if '$PROMPT_ID' in h:
    outputs = h['$PROMPT_ID'].get('outputs', {})
    if '9' in outputs:
        images = outputs['9'].get('images', [])
        if images:
            print(images[0]['filename'])
            sys.exit(0)
print('')
" 2>/dev/null)

  if [ -n "$STATUS" ]; then
    echo "Generated: $STATUS"
    # Copy from server to local
    scp "$COMFY_SERVER:$COMFY_OUTPUT/$STATUS" "$OUTPUT_FILE"
    echo "Saved to: $OUTPUT_FILE"
    exit 0
  fi
done

echo "ERROR: Timed out waiting for generation"
exit 1
