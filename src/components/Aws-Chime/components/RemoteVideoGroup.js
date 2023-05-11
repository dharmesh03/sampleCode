import React, { useContext } from 'react';
import cx from 'classnames';
import getChimeContext from '../context/getChimeContext';
import { ViewMode, IsFrom, Size } from '../enums/MeetingConstant';
import VideoTile from './VideoTile';

export default function RemoteVideoGroup(props) {
  const chime = useContext(getChimeContext());
  const {
    viewMode,
    isContentShareEnabled,
    attendees = [],
    totalAttendees,
    hideOverlayControl,
    raisedHandAttendees,
    isLocalVideoEnabled,
    numberOfVisibleIndices,
  } = props || {};

  const getSize = () => {
    if (totalAttendees >= 10) {
      return Size.Small;
    }
    if (totalAttendees >= 5) {
      return Size.Medium;
    }
    return Size.Large;
  };

  return (
    <div
      className={cx(
        'remoteVideoGroup',
        `remoteVideoGroup-${totalAttendees > 25 ? 25 : totalAttendees}`,
        {
          roomMode: viewMode === ViewMode.Room,
          screenShareMode: viewMode === ViewMode.ScreenShare,
          isContentShareEnabled,
        },
        chime.isFrom === IsFrom.ONE_TO_ONE_CALL &&
          totalAttendees === 1 &&
          (isContentShareEnabled ? 'custom-content' : 'full-screen-video'),
        chime.isFrom !== IsFrom.PIP_MODE_CHIME_MEETING && 'remoteVideoGroup-animation',
      )}
    >
      {attendees.map((attendee, index) => {
        const { attendeeId, active, name, profilePic, firstName, lastName } = attendee;
        const raisedHand = raisedHandAttendees ? raisedHandAttendees.has(attendeeId) : false;

        return (
          <VideoTile
            videoId={`video-${index + 1}`}
            key={`${attendee.tileId}_${attendeeId}_${attendee.userId}`}
            tileId={attendee.tileId}
            viewMode={viewMode}
            size={getSize()}
            attendeeId={attendeeId}
            numberOfVisibleIndices={numberOfVisibleIndices}
            raisedHand={raisedHand}
            activeSpeaker={active}
            isContentShareEnabled={isContentShareEnabled}
            enabled
            name={name}
            hideOverlayControl={hideOverlayControl}
            isLocalVideoEnabled={isLocalVideoEnabled}
            localAttendeeId={chime.attendeeId}
            profilePic={profilePic}
            firstName={firstName}
            lastName={lastName}
          />
        );
      })}
    </div>
  );
}
