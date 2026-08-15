import base64, hmac, os, time
import cv2
import numpy as np
from deepface import DeepFace
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
MODEL, DETECTOR, VERSION = "SFace", "yunet", "sface-v1"
class Candidate(BaseModel): employeeId: str; template: list[float]
class Policy(BaseModel): minimumSimilarityThreshold: float = Field(ge=-1, le=1); minimumScoreGap: float = Field(ge=0, le=2)
class EnrollRequest(BaseModel): imageBase64: str
class IdentifyRequest(BaseModel): imageBase64: str; candidates: list[Candidate]; policy: Policy
def authorize(token):
    expected=os.environ.get("BIOMETRIC_PROVIDER_TOKEN", "")
    if not expected or not hmac.compare_digest(token or "", expected): raise HTTPException(401, "unauthorized")
def image(raw):
    try:
        data=base64.b64decode(raw, validate=True)
        if len(data)>2_500_000: raise ValueError()
        decoded=cv2.imdecode(np.frombuffer(data,np.uint8),cv2.IMREAD_COLOR)
        if decoded is None: raise ValueError()
        return decoded
    except Exception: raise HTTPException(400,"invalid_image")
def quality(frame):
    brightness=float(np.mean(cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)))
    blur=float(cv2.Laplacian(frame,cv2.CV_64F).var())
    if brightness<45:return "TOO_DARK"
    if brightness>225:return "TOO_BRIGHT"
    if blur<35:return "BLURRY"
    return "GOOD"
def analyze(frame):
    started=time.perf_counter()
    faces=DeepFace.extract_faces(frame,detector_backend=DETECTOR,enforce_detection=False,anti_spoofing=True)
    relevant=[face for face in faces if face.get("facial_area",{}).get("w",0)>=80]
    face_count=len(relevant)
    if face_count==0:return None,{"faceCount":0,"quality":"FACE_NOT_FOUND","durationMs":round((time.perf_counter()-started)*1000)},False,0
    if face_count>1:return None,{"faceCount":face_count,"quality":"MULTIPLE_FACES","durationMs":round((time.perf_counter()-started)*1000)},False,0
    item=relevant[0]; live=bool(item.get("is_real",False)); score=float(item.get("antispoof_score",0))
    return item,{"faceCount":1,"quality":quality(frame),"durationMs":round((time.perf_counter()-started)*1000)},live,score
def embedding(frame): return DeepFace.represent(frame,model_name=MODEL,detector_backend=DETECTOR,enforce_detection=True,align=True)[0]["embedding"]
def cosine(left,right):
    a,b=np.asarray(left),np.asarray(right); return float(np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b)))
@app.get("/health")
def health(): return {"status":"ok","provider":"local-opencv","algorithmVersion":VERSION}
@app.post("/enroll")
def enroll(req:EnrollRequest,x_internal_token:str|None=Header(None)):
    authorize(x_internal_token); frame=image(req.imageBase64); _,detection,live,score=analyze(frame)
    liveness={"status":"PASSED" if live else "FAILED","score":score,"method":"PASSIVE","riskFlags":[] if live else ["PHOTO_ATTACK_SUSPECTED"],"durationMs":detection["durationMs"]}
    if detection["quality"]!="GOOD" or not live:return {"template":[],"quality":detection["quality"],"liveness":liveness,"provider":"local-opencv","algorithmVersion":VERSION}
    return {"template":embedding(frame),"quality":"GOOD","liveness":liveness,"provider":"local-opencv","algorithmVersion":VERSION}
@app.post("/identify")
def identify(req:IdentifyRequest,x_internal_token:str|None=Header(None)):
    authorize(x_internal_token); started=time.perf_counter(); frame=image(req.imageBase64); _,detection,live,liveness_score=analyze(frame); liveness={"status":"PASSED" if live else "FAILED","score":liveness_score,"method":"PASSIVE","riskFlags":[] if live else ["PHOTO_ATTACK_SUSPECTED"],"durationMs":detection["durationMs"]}
    if detection["quality"]!="GOOD" or not live:return {"decision":"NO_MATCH","detection":detection,"liveness":liveness,"provider":"local-opencv","algorithmVersion":VERSION,"durationMs":round((time.perf_counter()-started)*1000)}
    probe=embedding(frame); ranked=sorted(((cosine(probe,c.template),c.employeeId) for c in req.candidates),reverse=True); best=ranked[0] if ranked else (None,None); second=ranked[1][0] if len(ranked)>1 else None
    decision="NO_MATCH" if best[0] is None or best[0]<req.policy.minimumSimilarityThreshold else "AMBIGUOUS" if second is not None and best[0]-second<req.policy.minimumScoreGap else "MATCH"
    return {"employeeId":best[1] if decision=="MATCH" else None,"score":best[0],"secondBestScore":second,"decision":decision,"detection":detection,"liveness":liveness,"provider":"local-opencv","algorithmVersion":VERSION,"durationMs":round((time.perf_counter()-started)*1000)}
