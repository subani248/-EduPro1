from fastapi import FastAPI, UploadFile, File, Form
import cv2
import numpy as np
import os
import json
import logging
from .face_detection import detectFace
from .gaze_tracking import gaze_tracking
from .object_detection import detectObject

# Hide YOLO logs
logging.getLogger("ultralytics").setLevel(logging.WARNING)

app = FastAPI()

def process_frame(frame):
    results = {
        "faceCount": 0,
        "gaze": "center",
        "detectedObjects": [],
        "personCount": 0,
        "violations": []
    }

    try:
        # 1. Face Detection & Annotation
        face_count, frame = detectFace(frame)
        results["faceCount"] = face_count
        
        # 2. Gaze Tracking
        gaze_res = gaze_tracking(frame)
        results["gaze"] = gaze_res.get("gaze", "center")

        # 3. Object Detection (Cell Phone, Book, Person)
        labels, frame, person_count, detected_obj_list = detectObject(frame)
        results["detectedObjects"] = list(set(detected_obj_list))
        results["personCount"] = person_count

        # 4. Logical Violations based on AI
        if face_count > 1 or person_count > 1:
            results["violations"].append("MULTIPLE_FACES")
        if face_count == 0:
            results["violations"].append("NO_FACE")
        if results["gaze"] in ["left", "right"]:
            results["violations"].append("SUSPICIOUS_GAZE")
        if "cell phone" in results["detectedObjects"]:
            results["violations"].append("CELL_PHONE_DETECTED")
        if "book" in results["detectedObjects"]:
            results["violations"].append("BOOK_DETECTED")

    except Exception as e:
        return {"error": str(e)}

    return results

@app.post("/analyze")
async def analyze_snapshot(file: UploadFile = File(...)):
    try:
        # Read the uploaded image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"error": "Failed to decode image"}

        # Process the frame
        results = process_frame(frame)
        
        return results
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def health_check():
    return {"status": "AI Engine is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
