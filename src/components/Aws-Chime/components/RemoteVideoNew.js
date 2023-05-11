import React, { useRef, useEffect, useContext } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import getChimeContext from '../context/getChimeContext';
import { ViewMode } from '../enums/MeetingConstant';
import VideoNameplate from './VideoNameplate';
import OverlayControls from './OverlayControls';
import { showAlert } from '../../../routes/event/action/portalAction';

export const RemoteVideo = (props) => {
  const {
    tileId,
    viewMode,
    attendeeId,
    raisedHand,
    activeSpeaker,
    isContentShareEnabled,
    enabled,
    videoId,
    name,
    hideOverlayControl,
    numberOfVisibleIndices,
  } = props;
  const chime = useContext(getChimeContext());
  const audioVideo = chime.audioVideo;
  const videoEl = useRef(null);

  const showMessage = (text, isError = false) => {
    props.showAlert({ message: text, success: !isError });
  };

  useEffect(() => {
    if (!audioVideo || !videoEl.current) {
      return null;
    }
    audioVideo.bindVideoElement(tileId, videoEl.current);

    return () => {
      const tile = audioVideo.getVideoTile(tileId);
      if (tile) {
        audioVideo.unbindVideoElement(tileId);
      }
      return null;
    };
  }, [audioVideo, tileId]);

  return (
    <div
      className={cx('remoteVideo', videoId, {
        roomMode: viewMode === ViewMode.Room,
        screenShareMode: viewMode === ViewMode.ScreenShare,
        enabled,
        'overlay-control': !hideOverlayControl,
      })}
    >
      <video muted ref={videoEl} className={cx('video', { activeSpeaker })} onContextMenu={(e) => e.preventDefault()} />
      {numberOfVisibleIndices > 1 && <OverlayControls attendeeId={attendeeId} showMessage={showMessage} />}
      <VideoNameplate
        viewMode={viewMode}
        size={props.size}
        isContentShareEnabled={isContentShareEnabled}
        attendeeId={attendeeId}
        name={name}
      />
      {raisedHand && (
        <div className="raisedHand">
          <span role="img" aria-label={'Raise Hand'}>
            ✋
          </span>
        </div>
      )}
    </div>
  );
};

const mapDispatchToProps = { showAlert };

export default connect(null, mapDispatchToProps)(RemoteVideo);
