import React, { useContext, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import getChimeContext from '../context/getChimeContext';

export default function LocalVideo(props) {
  const [enabled, setEnabled] = useState(false);
  const chime = useContext(getChimeContext());
  const localVideoElement = useRef(null);

  useEffect(() => {
    const observer = {
      videoTileDidUpdate: (tileState) => {
        if (
          !tileState.boundAttendeeId ||
          !tileState.localTile ||
          !tileState.tileId ||
          !localVideoElement ||
          !localVideoElement.current
        ) {
          return;
        }
        chime.audioVideo &&
          chime.audioVideo.bindVideoElement(tileState.tileId, localVideoElement && localVideoElement.current);
        setEnabled(tileState.active);
        props.onLocalVideoStatus(tileState.active);
      },
    };
    chime.audioVideo && chime.audioVideo.addObserver(observer);
    return () => {
      chime.audioVideo && chime.audioVideo.removeObserver(observer);
    };
  }, [chime.audioVideo]);

  return (
    <div
      className={cx('localVideo', {
        enabled,
      })}
    >
      <video muted ref={localVideoElement} className="video-hand video" />
    </div>
  );
}
