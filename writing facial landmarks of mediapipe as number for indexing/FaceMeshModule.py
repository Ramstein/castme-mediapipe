import random
import time

import cv2
import mediapipe as mp


class FaceMeshDetector():

    def __init__(self, staticMode=False, maxFaces=2, minDetectionCon=0.5, minTrackCon=0.5):

        self.staticMode = staticMode
        self.maxFaces = maxFaces
        self.minDetectionCon = minDetectionCon
        self.minTrackCon = minTrackCon

        self.mpDraw = mp.solutions.drawing_utils
        self.mpFaceMesh = mp.solutions.face_mesh
        self.faceMesh = self.mpFaceMesh.FaceMesh(self.staticMode, self.maxFaces,
                                                 self.minDetectionCon, self.minTrackCon)
        self.drawSpec = self.mpDraw.DrawingSpec(thickness=1, circle_radius=1)

    def findFaceMesh(self, img, draw=True):
        self.imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.faceMesh.process(self.imgRGB)
        faces = []
        if self.results.multi_face_landmarks:
            for faceLms in self.results.multi_face_landmarks:
                # if draw:
                #     self.mpDraw.draw_landmarks(img, faceLms, self.mpFaceMesh.FACE_CONNECTIONS,
                #                                self.drawSpec, self.drawSpec)
                face = []
                index = 0
                for id, lm in enumerate(faceLms.landmark):
                    # print(lm)
                    ih, iw, ic = img.shape
                    x, y = int(lm.x * iw), int(lm.y * ih)

                    cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5,
                                (random.randrange(0, 255), random.randrange(0, 255), random.randrange(0, 255)), 0)

                    # if index == 0: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (255, 0, 0), 0);index=1
                    # elif index == 1: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5,
                    #                              (random.randrange(0, 255), random.randrange(0, 255), random.randrange(0, 255)), 0);index=0
                    # elif index == 2: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (0, 0, 255), 0);index=3
                    # elif index == 3: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (255, 255, 255), 0);index=4
                    # elif index == 4: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (0, 0, 0), 0);index=5
                    # elif index == 5: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (124, 255, 255), 0);index=6
                    # elif index == 6: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (0, 124, 255), 0);index=7
                    # elif index == 7: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (0, 0, 124), 0);index=8
                    # elif index == 8: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (100, 100, 0), 0);index=9
                    # elif index == 9: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (0, 100, 100), 0);index=10
                    # elif index == 10: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (100, 0, 100), 0);index=11
                    # elif index == 11: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (100, 0, 255), 0);index=12
                    # elif index == 12: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (100, 255, 0), 0);index=13
                    # elif index == 13: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (0, 100, 255), 0);index=14
                    # elif index == 14: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (0, 255, 100), 0);index=15
                    # elif index == 15: cv2.putText(img, str(id), (x, y), cv2.FONT_HERSHEY_PLAIN, 0.5, (50, 50, 100), 0);index=0

                    # print(id,x,y)
                    face.append([x, y])
                faces.append(face)
        return img, faces


def main():
    # cap = cv2.VideoCapture(r"C:\Users\user\Downloads\eryde business\Pitch Raw Video\eryde car fleet accelarated development data 4k Match Source.mp4")
    cap = cv2.VideoCapture(0)

    cv2.namedWindow("output", cv2.WINDOW_NORMAL)  # Create window with freedom of dimensions
    cv2.resizeWindow("output", 3840, 2160)
    pTime = 0
    detector = FaceMeshDetector(maxFaces=2)
    while True:
        success, img = cap.read()
        img, faces = detector.findFaceMesh(img)
        # if len(faces)!= 0:
        # print(faces[0])
        cTime = time.time()
        fps = 1 / (cTime - pTime)
        pTime = cTime
        cv2.putText(img, f'FPS: {int(fps)}', (20, 70), cv2.FONT_HERSHEY_PLAIN,
                    1.5, (255, 255, 255), 2)
        cv2.imshow("output", img)
        cv2.waitKey(1)


if __name__ == "__main__":
    main()
