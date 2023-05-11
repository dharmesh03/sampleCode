import React, { memo } from 'react';
import RemoteVideoNew from './RemoteVideoNew';
import UserAvatar from './UserAvatarImage';

const VideoTile = ({
  tileId,
  viewMode,
  attendeeId,
  raisedHand,
  activeSpeaker,
  isContentShareEnabled,
  numberOfVisibleIndices,
  name,
  videoId,
  size,
  hideOverlayControl,
  isLocalVideoEnabled,
  localAttendeeId,
  profilePic,
  firstName,
  lastName,
}) => {
  // const isLocalVideoEnabled = chime.audioVideo ? chime.audioVideo.hasStartedLocalVideoTile() : false;
  const isLocalAttendee = localAttendeeId === attendeeId;
  const showVideo = isLocalAttendee ? isLocalVideoEnabled : tileId;
  return showVideo ? (
    <RemoteVideoNew
      key={tileId}
      tileId={tileId}
      viewMode={viewMode}
      size={size}
      attendeeId={attendeeId}
      numberOfVisibleIndices={numberOfVisibleIndices}
      raisedHand={raisedHand}
      activeSpeaker={numberOfVisibleIndices > 1 ? activeSpeaker : false}
      isContentShareEnabled={isContentShareEnabled}
      enabled
      videoId={videoId}
      name={name}
      hideOverlayControl={hideOverlayControl}
    />
  ) : (
    <UserAvatar
      key={attendeeId}
      viewMode={viewMode}
      size={size}
      isContentShareEnabled={isContentShareEnabled}
      attendeeId={attendeeId}
      name={name}
      videoId={videoId}
      raisedHand={raisedHand}
      hideOverlayControl={hideOverlayControl}
      activeSpeaker={numberOfVisibleIndices > 0 ? activeSpeaker : false}
      numberOfVisibleIndices={numberOfVisibleIndices}
      profilePic={profilePic}
      firstName={firstName}
      lastName={lastName}
    />
  );
};

export default memo(VideoTile);
