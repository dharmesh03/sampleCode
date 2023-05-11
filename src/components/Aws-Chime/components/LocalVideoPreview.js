import get from 'lodash/get';
import React, { useRef, useContext, useEffect, useState } from 'react';
import { AsyncScheduler } from 'amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';

const LocalPreviewVideo = ({ className }) => {
  const videoEl = useRef(null);
  const chime = useContext(getChimeContext());
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const videoElement = videoEl?.current;
    const deviceId = get(chime, 'currentVideoInputDevice.value', null);
    if (!videoElement || !chime.audioVideo) {
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { deviceId } }).then((videoStream) => {
      setStream(videoStream);

      if (videoElement.hasAttribute('controls')) {
        videoElement.removeAttribute('controls');
      }

      if (!videoElement.hasAttribute('autoplay')) {
        videoElement.setAttribute('autoplay', 'true');
      }

      if (!videoElement.hasAttribute('playsinline')) {
        videoElement.setAttribute('playsinline', 'true');
      }

      if (!videoElement.hasAttribute('muted')) {
        videoElement.setAttribute('muted', 'true');
        videoElement.muted = true;
      }

      if (videoElement.srcObject !== videoStream) {
        videoElement.srcObject = videoStream;
      }

      new AsyncScheduler().start(async () => {
        try {
          await videoElement.play();
        } catch (error) {
          console.error(`Local video preview : ${error}`);
        }
      });
    });
  }, [chime.currentVideoInputDevice]);

  useEffect(
    () => () => {
      stream && stream.getTracks().forEach((t) => t.stop());
    },
    [stream, chime.audioVideo],
  );

  return <video ref={videoEl} className={className} style={{ transform: 'rotateY(180deg)' }} />;
};

export default LocalPreviewVideo;
