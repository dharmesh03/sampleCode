import cx from 'classnames';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import VideoNameplate from './VideoNameplate';
import useAttendees from '../hooks/useAttendees';
import { ViewMode, Size } from '../enums/MeetingConstant';
import AELabel from '../../../Core/Label/label';
import UserAvatar from './UserAvatarImage';
import getChimeContext from '../context/getChimeContext';

export default function OneToOneRemoteVideo(props) {
  const { viewMode, isContentShareEnabled } = props;
  const chime = useContext(getChimeContext());
  const [matchedAttendee, setMatchedAttendee] = useState(null);
  const videoElement = useRef(null);
  const roster = useAttendees();
  const rosterLength = Object.keys(roster).length;

  const { t } = useTranslation(['networking', 'chime']);

  useEffect(() => {
    const attendeeIds = Object.keys(roster);
    const matchedAttendeId = attendeeIds.find((id) => id !== chime.attendeeId);
    if (matchedAttendeId && roster[matchedAttendeId]) {
      const attendee = roster[matchedAttendeId];
      setMatchedAttendee(attendee);
      if (attendee && attendee.tileId) {
        chime.audioVideo && chime.audioVideo.bindVideoElement(attendee.tileId, videoElement && videoElement.current);
      }
    }
  }, [roster]);

  return (
    <div
      className={cx(
        'remoteVideoGroup',
        'remoteVideoGroup-1',
        {
          roomMode: viewMode === ViewMode.Room,
          screenShareMode: viewMode === ViewMode.ScreenShare,
        },
        isContentShareEnabled ? 'isContentShareEnabled custom-content' : 'full-screen-video',
      )}
    >
      <div className={cx('instruction', isContentShareEnabled && 'd-none')}>
        <AELabel
          header={
            rosterLength === 0
              ? t('chime:YouAreJoiningTheMeeting')
              : rosterLength === 1
              ? t('WaitingForYouMatchToJoinMeeting')
              : ''
          }
          variant={'heading3'}
          className="justify-content-center"
          color="#b4aeae"
          role="region"
          aria-label={
            rosterLength === 0
              ? 'You are joining the meeting!'
              : rosterLength === 1
              ? 'Waiting for your match to join the meeting'
              : ''
          }
        />
      </div>

      <div
        className={cx('remoteVideo', {
          roomMode: viewMode === ViewMode.Room,
          screenShareMode: viewMode === ViewMode.ScreenShare,
          enabled: matchedAttendee && matchedAttendee.tileId,
        })}
      >
        <video
          muted
          id="remote-video-element-id"
          ref={videoElement}
          className="video"
          onContextMenu={(e) => e.preventDefault()}
        />
        <VideoNameplate
          viewMode={viewMode}
          size={Size.Large}
          attendeeId={matchedAttendee && matchedAttendee.attendeeId}
          isContentShareEnabled={isContentShareEnabled}
          name={matchedAttendee && matchedAttendee.name}
        />
      </div>
      {(matchedAttendee && matchedAttendee.tileId) || rosterLength !== 2 ? null : (
        <UserAvatar
          viewMode={viewMode}
          size={Size.Large}
          isContentShareEnabled={isContentShareEnabled}
          attendeeId={matchedAttendee && matchedAttendee.attendeeId}
          name={matchedAttendee && matchedAttendee.name}
          videoId={`video-1`}
          hideOverlayControl
          firstName={matchedAttendee?.firstName}
          lastName={matchedAttendee?.lastName}
          profilePic={matchedAttendee?.profilePic}
        />
      )}
    </div>
  );
}
