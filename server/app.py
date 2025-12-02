# server/app.py (최종 완성본)
from fastapi import FastAPI, File, UploadFile, Form
from PIL import Image
import torch
import torch.nn as nn
from transformers import CLIPProcessor, CLIPModel
import io

app = FastAPI()
device = "cpu"

# ==========================================
# 1. 두 가지 모델 설계도 모두 준비
# ==========================================

# (A) 가벼운 모델 (LightStyleNet)
class LightStyleNet(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 128), nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(128, num_classes)
        )
    def forward(self, x): return self.layers(x)

# (B) 깊은 모델 (StyleNet)
class StyleNet(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(512, 512), nn.BatchNorm1d(512), nn.ReLU(), nn.Dropout(0.5),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )
    def forward(self, x): return self.layers(x)

# ==========================================
# 2. 스마트 로딩 함수
# ==========================================
def smart_load(path, model_name):
    print(f"🔄 {model_name} 로딩 시도 중...")
    
    # 시도 1: StyleNet (깊은 거)
    try:
        model = StyleNet(num_classes=4)
        model.load_state_dict(torch.load(path, map_location=device))
        model.eval()
        print(f"✅ {model_name}: StyleNet 구조로 로딩 성공!")
        return model
    except:
        pass 

    # 시도 2: LightStyleNet (가벼운 거)
    try:
        model = LightStyleNet(num_classes=4)
        model.load_state_dict(torch.load(path, map_location=device))
        model.eval()
        print(f"✅ {model_name}: LightStyleNet 구조로 로딩 성공!")
        return model
    except:
        print(f"❌ {model_name}: 로딩 실패! (파일이 깨졌거나 구조가 아예 다름)")
        return None

# ==========================================
# 3. 모델 준비
# ==========================================
print("⏳ 모델 준비 중...")
try:
    clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    print("✅ CLIP 로드 완료")
except:
    print("❌ CLIP 로드 실패")

models = {}
models['male'] = smart_load("male_model.pth", "남자 모델")
models['female'] = smart_load("female_model.pth", "여자 모델")


# ==========================================
# 4. 예측 API
# ==========================================
@app.post("/predict")
async def predict(gender: str = Form(...), file: UploadFile = File(...)):
    # 이미지 읽기
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    # CLIP 특징 추출
    inputs = clip_processor(images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
        features /= features.norm(dim=-1, keepdim=True)

    # 모델 선택
    target_model = models.get(gender)
    if target_model is None:
        return {"result": f"Error: {gender} 모델 로딩 실패"}

    # 예측
    with torch.no_grad():
        outputs = target_model(features)
        _, predicted = torch.max(outputs, 1)
        
    idx = predicted.item()

    # ★ 결과 라벨링 (여기가 수정되었습니다!)
    if gender == 'male':
        # 남자
        style_names = ['Americaji Vintage', 'Casual', 'Minimal Chic Dandy', 'Street Gorpcore']
        result = style_names[idx]
        
    else:
        # 여자: 알려주신 순서 그대로 적용!
        female_styles = ['Casual Street', 'Feminine Minimal', 'Lovely', 'Unique']
        
        if idx < len(female_styles):
            result = female_styles[idx]
        else:
            result = "Unknown"

    return {"result": result}