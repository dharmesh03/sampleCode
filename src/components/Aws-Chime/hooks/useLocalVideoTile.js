import { useContext, useEffect, useState } from 'react';
import getChimeContext from '../context/getChimeContext';

export default function useLocalVideoTile() {
  const chime = useContext(getChimeContext());
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [tileId, setTileId] = useState(null);

  useEffect(() => {
    const observer = {
      videoTileDidUpdate: (tileState) => {
        if (!tileState.boundAttendeeId || !tileState.localTile || !tileState.tileId) {
          return;
        }
        setIsVideoEnabled(chime.audioVideo.hasStartedLocalVideoTile());
        setTileId(tileState.tileId);
      },
    };
    chime?.audioVideo?.addObserver(observer);
    return () => {
      chime?.audioVideo?.removeObserver(observer);
    };
  }, [chime.audioVideo]);
  return { isVideoEnabled, tileId };
}
