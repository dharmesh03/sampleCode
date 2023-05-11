import { useEffect, useState, useContext } from 'react';
import getChimeContext from '../context/getChimeContext';

const useAudioVideo = () => {
  const chime = useContext(getChimeContext());
  const [audioVideo, setAudioVideo] = useState(null);

  useEffect(() => {
    function audioVideoUpdateCb(av) {
      setAudioVideo(av);
    }

    chime.subscribeToAudioVideo(audioVideoUpdateCb);

    return () => chime.unsubscribeFromAudioVideo(audioVideoUpdateCb);
  }, []);

  useEffect(() => {
    if (chime?.audioVideo) {
      setAudioVideo(chime?.audioVideo);
    }
  }, [chime?.audioVideo]);

  return audioVideo;
};

export default useAudioVideo;
