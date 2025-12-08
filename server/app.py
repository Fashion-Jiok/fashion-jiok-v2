# server/app.py

from fastapi import FastAPI, File, UploadFile, Form
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F  # 확률 계산용 (softmax)
from transformers import CLIPProcessor, CLIPModel
import io
import uvicorn  # 서버 실행용

app = FastAPI()
device = "cpu"  # GPU가 있다면 "cuda"

# ==========================================
# 1. 모델 아키텍처 정의 (기존과 동일)
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
    
    # 시도 1: StyleNet
    try:
        model = StyleNet(num_classes=4)
        model.load_state_dict(torch.load(path, map_location=device))
        model.eval()
        print(f"✅ {model_name}: StyleNet 구조로 로딩 성공!")
        return model
    except:
        pass 

    # 시도 2: LightStyleNet
    try:
        model = LightStyleNet(num_classes=4)
        model.load_state_dict(torch.load(path, map_location=device))
        model.eval()
        print(f"✅ {model_name}: LightStyleNet 구조로 로딩 성공!")
        return model
    except:
        print(f"❌ {model_name}: 로딩 실패! (파일 경로 확인 필요)")
        return None

# ==========================================
# 3. 모델 준비
# ==========================================
print("⏳ 모델 준비 중...")
try:
    clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    print("✅ CLIP 로드 완료")
except Exception as e:
    print(f"❌ CLIP 로드 실패: {e}")

models = {}
# 같은 폴더에 .pth 파일이 있어야 합니다.
models['male'] = smart_load("male_model.pth", "남자 모델")
models['female'] = smart_load("female_model.pth", "여자 모델")


# ==========================================
# 4. 예측 API (앱으로 확률 정보 전송)
# ==========================================
@app.post("/predict")
async def predict(gender: str = Form(...), file: UploadFile = File(...)):
    # 1. 이미지 읽기
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # ⭐️ [속도 최적화] 이미지 크기 강제 축소
    image = image.resize((224, 224))

    # 2. CLIP 특징 추출
    inputs = clip_processor(images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
        features /= features.norm(dim=-1, keepdim=True)

    # 3. 모델 선택
    target_model = models.get(gender)
    if target_model is None:
        return {"result": f"Error: {gender} 모델 로딩 실패"}

    # 4. 예측 및 확률 계산
    with torch.no_grad():
        outputs = target_model(features)
        
        # 확률(%) 계산
        probs = F.softmax(outputs, dim=1) 
        top_prob, predicted = torch.max(probs, 1)
        
    idx = predicted.item()
    confidence_val = top_prob.item() * 100 # 숫자값 (예: 85.5)

    # 5. 결과 라벨링
    if gender == 'male':
        # 남자 라벨 순서 (학습된 순서와 같아야 함)
        style_names = ['Americaji Vintage', 'Casual', 'Minimal Chic Dandy', 'Street Gorpcore']
        result = style_names[idx] if idx < len(style_names) else "Unknown"
        
    else:
        # 여자 라벨 순서
        female_styles = ['Casual Street', 'Feminine Minimal', 'Lovely', 'Unique']
        result = female_styles[idx] if idx < len(female_styles) else "Unknown"

    # ==================================================
    # ⭐️ [핵심] 앱으로 보낼 데이터 (확률 포함)
    # ==================================================
    
    # 확률 리스트 보기 좋게 변환 (예: [10.5, 80.2, 5.0, 4.3])
    prob_list = [round(p * 100, 1) for p in probs.tolist()[0]]

    # 서버 터미널에도 로그 출력
    print(f"📸 요청: {gender} | 결과: {result} ({confidence_val:.1f}%)")
    print(f"📊 분포: {prob_list}")

    return {
        "result": result,                 # 스타일 이름
        "confidence": f"{confidence_val:.1f}%", # 확신도 (문자열)
        "probabilities": prob_list        # 전체 확률 분포 (배열)
    }

if __name__ == "__main__":
    print("🚀 AI 분석 서버 시작 (포트: 8000)")
    uvicorn.run(app, host="0.0.0.0", port=8000)