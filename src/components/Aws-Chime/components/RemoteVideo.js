import React from 'react';
import cx from 'classnames';
import lengthSize from 'lodash/size';
import { ViewMode, Size } from '../enums/MeetingConstant';
import VideoNameplate from './VideoNameplate';
import useAttendee from '../hooks/useAttendee';

let perVideoWidth = 350;
let styles = {};

export default function RemoteVideo(props) {
  const {
    viewMode,
    enabled,
    videoIndex,
    videoElementRef,
    size = Size.Large,
    attendeeId,
    raisedHand,
    activeSpeaker,
    isContentShareEnabled,
    cameraONUserList,
    showPipModeVideo,
    numberOfVisibleIndices,
  } = props;

  let attendee = null;
  if (attendeeId) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    attendee = useAttendee(attendeeId);
  }

  const totalCameraONUser = lengthSize(cameraONUserList);
  const pipVideo = document.querySelector('#pipVideo');

  const handleWidth = (pipVideoWidth) => {
    if (totalCameraONUser > 6) {
      return parseFloat(pipVideoWidth) / 4;
    }
    if (totalCameraONUser > 4) {
      return parseFloat(pipVideoWidth) / 3;
    }
    if (totalCameraONUser >= 2) {
      return parseFloat(pipVideoWidth) / 2 - 15;
    }
    return pipVideoWidth - 30;
  };

  const handleIsContentShareEnabledWidth = (pipVideoWidth) => {
    if (isContentShareEnabled) {
      return handleWidth(pipVideoWidth) - 5;
    }
    return handleWidth(pipVideoWidth);
  };

  if (pipVideo && enabled) {
    const pipVideoWidth = 100;
    perVideoWidth = handleIsContentShareEnabledWidth(pipVideoWidth);
    styles = { width: `${perVideoWidth}%`, padding: '5px' };
  } else {
    styles = {};
  }

  return (
    <div
      className={cx(
        'remoteVideo',
        {
          roomMode: viewMode === ViewMode.Room,
          screenShareMode: viewMode === ViewMode.ScreenShare,
          activeSpeaker,
          enabled,
        },
        showPipModeVideo && enabled && videoIndex < (isContentShareEnabled ? 3 : 8) && 'pip-enabled',
      )}
      style={styles}
    >
      <video muted ref={videoElementRef} className="video" />
      {numberOfVisibleIndices > 1 && (
        <VideoNameplate
          viewMode={viewMode}
          size={size}
          totalCameraONUser={totalCameraONUser}
          showPipModeVideo={showPipModeVideo}
          isContentShareEnabled={isContentShareEnabled}
          attendeeId={attendeeId}
        />
      )}
      {raisedHand && (
        <div className="raisedHand">
          <span
            role="img"
            aria-live="polite"
            aria-label={attendee && attendee.name ? `${attendee && attendee.name} is raising hand` : 'Raise hand'}
          >
            ✋
          </span>
        </div>
      )}
    </div>
  );
}
