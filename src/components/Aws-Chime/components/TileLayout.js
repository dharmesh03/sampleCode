import React, { useContext } from 'react';
import cx from 'classnames';
import size from 'lodash/size';
import uniq from 'lodash/uniq';
import { useTranslation } from 'react-i18next';
import { DefaultModality } from 'amazon-chime-sdk-js';

import useAttendees from '../hooks/useAttendees';
import useActiveSpeaker from '../hooks/useActiveSpeaker';
import getChimeContext from '../context/getChimeContext';
import { ViewMode, IsFrom, Size } from '../enums/MeetingConstant';

import VideoTile from './VideoTile';
import ContentVideo from './ContentVideo';
import RemoteVideoGroup from './RemoteVideoGroup';
import ScreenShareHeader from './ScreenShareHeader';
import AELabel from '../../../Core/Label/label';
import AESpinner from '../../../Core/Spinner/Spinner';
import useLocalVideoTile from '../hooks/useLocalVideoTile';
import useRaisedHandAttendees from '../hooks/useRaisedHandAttendees';

export default function TileLayout(props) {
  const {
    isFrom,
    viewMode,
    hasJoinedExpo,
    isContentShareEnabled,
    onContentShareEnabled,
    isFromChimePIPMode = false,
  } = props;
  const chime = useContext(getChimeContext());
  const roster = useAttendees();
  const { t } = useTranslation('chime');
  const activeSpeaker = useActiveSpeaker();
  const { isVideoEnabled } = useLocalVideoTile();
  const raisedHandAttendees = useRaisedHandAttendees();

  let attendees = [];
  let featuredAttendee = null;
  const screenshareAttendees = [];
  const activeVideoAttendees = [];
  const activeSpeakersAttendees = [];
  const activeRaisedHandAttendees = [];

  const attendeesList = Object.keys(roster)
    .filter((attendeeId) => {
      if (!roster[attendeeId]) {
        return false;
      }
      if (
        isFrom === IsFrom.EXHIBITOR_STUDIO &&
        !(attendeeId === chime.attendeeId ? isVideoEnabled : roster[attendeeId].tileId)
      ) {
        return false;
      }
      const modality = new DefaultModality(attendeeId);
      const isScreenSharedAttendee = modality.hasModality(DefaultModality.MODALITY_CONTENT);
      isScreenSharedAttendee && screenshareAttendees.push(modality.base());
      return !isScreenSharedAttendee && roster[attendeeId].userId;
    })
    .map((attendeeId, index) => {
      const isActiveSpeaker = activeSpeaker?.attendeeId === attendeeId && activeSpeaker.active;
      const attendee = {
        name: roster[attendeeId].name,
        attendeeId,
        tileId: roster[attendeeId].tileId,
        userId: roster[attendeeId].userId,
        active: isActiveSpeaker,
        isPin: roster[attendeeId].isPin,
        tileIndex: roster[attendeeId]?.tileIndex || index,
        profilePic: roster[attendeeId]?.profilePic || '',
        firstName: roster[attendeeId]?.firstName,
        lastName: roster[attendeeId]?.lastName,
      };
      const isRaisedHand = raisedHandAttendees.has(attendeeId);
      const isVideoOn = attendeeId === chime?.attendeeId ? attendee?.tileId && isVideoEnabled : attendee?.tileId;
      if (isActiveSpeaker) {
        activeSpeakersAttendees.push(attendee);
        activeSpeaker.tileIndex = index;
      }
      if (isRaisedHand) activeRaisedHandAttendees.push(attendee);
      if (isVideoOn) activeVideoAttendees.push(attendee);
      return attendee;
    });

  const pinnedAttendee = attendeesList.find((attendee) => attendee.isPin);
  const mode = pinnedAttendee ? ViewMode.Featured : viewMode;
  const isJoining =
    size(
      Object.keys(roster).filter((attendeeId) => attendeeId && roster[attendeeId] && !!roster[attendeeId].userId),
    ) === 0;

  const filterActiveTiles = () => {
    let filteredAttendees = [];
    filteredAttendees = attendeesList;
    return filteredAttendees;
  };
  // const test = [];
  // for (let index = 0; index < 8; index++) {
  //   attendeesList.length && test.push(attendeesList[0]);
  // }

  if (chime.isFrom === IsFrom.PIP_MODE_CHIME_MEETING) {
    attendees = filterActiveTiles();
    attendees = attendees
      .sort((a, b) => {
        if (a.active) {
          return -1;
        }
        if (b.active) {
          return 1;
        }
        return 0;
      })
      .slice(0, chime.maxVideoTilesCount);
  } else {
    attendees = filterActiveTiles();
  }

  if (mode === ViewMode.Featured && !isContentShareEnabled) {
    if (pinnedAttendee) {
      featuredAttendee = pinnedAttendee;
    } else {
      featuredAttendee = attendees.find((attendee) => attendee.active) || attendees[0];
    }
    attendees = attendees.filter((attendee) => attendee.attendeeId !== featuredAttendee.attendeeId);
  }

  if (isContentShareEnabled) {
    attendees = uniq(
      [
        pinnedAttendee,
        ...screenshareAttendees.map((attendeeId) => attendees.find((attendee) => attendee?.attendeeId === attendeeId)),
        ...activeSpeakersAttendees,
        ...activeRaisedHandAttendees,
        ...activeVideoAttendees,
        ...attendees,
      ].filter((attendee) => attendee?.attendeeId),
      'attendeeId',
    );
  } else if (featuredAttendee) {
    attendees = uniq(
      [...activeSpeakersAttendees, ...activeRaisedHandAttendees, ...activeVideoAttendees, ...attendees].filter(
        (attendee) => {
          if (attendee?.attendeeId) {
            return attendee?.attendeeId !== featuredAttendee?.attendeeId;
          }
          return false;
        },
      ),
      'attendeeId',
    );
  }

  if (chime.maxVideoTilesCount < 25 || attendees.length > 25) {
    if (!isContentShareEnabled && !pinnedAttendee && viewMode !== ViewMode.Featured) {
      attendees = chime.reshuffleVideoTiles(attendees, {
        activeSpeaker,
        activeRaisedHandAttendees,
      });
    }
    if (!isContentShareEnabled && (pinnedAttendee || viewMode === ViewMode.Featured)) {
      attendees = attendees.slice(0, chime.maxVideoTilesCount - 1);
    } else {
      attendees = attendees.slice(0, chime.maxVideoTilesCount);
    }
  }
  chime.tileOrder = attendees;

  const isFromExpo = chime.isFrom === IsFrom.EXHIBITOR_PORTAL || chime.isFrom === IsFrom.EXHIBITOR_STUDIO;
  const hideOverlayControl =
    chime.isFrom === IsFrom.NETWORKING ||
    chime.isFrom === IsFrom.PIP_MODE_CHIME_MEETING ||
    (isFromExpo && !hasJoinedExpo);
  return (
    <div
      className={cx('videoLayout', {
        featuredMode: mode === ViewMode.Featured || isContentShareEnabled,
        isContentShareEnabled,
      })}
    >
      <div className={'featuredVideo'}>
        <ScreenShareHeader />
        <div className="contentVideoWrapper" onContextMenu={(e) => e.preventDefault()}>
          <ContentVideo onContentShareEnabled={onContentShareEnabled} />
        </div>
        {!featuredAttendee || isContentShareEnabled || mode !== ViewMode.Featured ? null : (
          <VideoTile
            tileId={featuredAttendee.tileId}
            viewMode={mode}
            size={Size.Large}
            attendeeId={featuredAttendee.attendeeId}
            numberOfVisibleIndices={attendeesList.length}
            raisedHand={raisedHandAttendees ? raisedHandAttendees.has(featuredAttendee.attendeeId) : false}
            activeSpeaker={activeSpeaker && featuredAttendee?.attendeeId === activeSpeaker?.attendeeId}
            isContentShareEnabled={isContentShareEnabled}
            enabled
            name={featuredAttendee.name}
            userId={featuredAttendee.userId}
            hideOverlayControl={hideOverlayControl}
            isLocalVideoEnabled={isVideoEnabled}
            localAttendeeId={chime.attendeeId}
            firstName={featuredAttendee?.firstName}
            lastName={featuredAttendee?.lastName}
            profilePic={featuredAttendee?.profilePic}
          />
        )}
      </div>
      {(isFromChimePIPMode && !isContentShareEnabled && attendees.length) ||
      (!isFromChimePIPMode && attendees.length) ? (
        <div
          className={cx('remoteVideoGroupWrapper', {
            featueMode: mode === ViewMode.Featured,
          })}
        >
          <RemoteVideoGroup
            attendees={attendees}
            viewMode={mode}
            isContentShareEnabled={isContentShareEnabled}
            totalAttendees={attendees.length}
            hideOverlayControl={hideOverlayControl}
            raisedHandAttendees={raisedHandAttendees}
            isLocalVideoEnabled={isVideoEnabled}
            numberOfVisibleIndices={attendeesList.length}
          />
        </div>
      ) : null}
      {isJoining ? (
        <div className="instruction">
          <AELabel
            header={
              chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM
                ? t('YouAreJoiningTheRoom', { title: chime.title || t('Room') })
                : t('YouAreJoiningTheMeeting')
            }
            variant={chime.isFrom === IsFrom.PIP_MODE_CHIME_MEETING ? 'subtitle2' : 'heading3'}
            className={'justify-content-center'}
            color="#9e9e9e"
          />
          <AESpinner type="SpinnerSmall" />
        </div>
      ) : null}
      {!isJoining &&
      isFrom === IsFrom.EXHIBITOR_STUDIO &&
      size(attendees) === 0 &&
      !featuredAttendee &&
      !isContentShareEnabled ? (
        <div className="instruction">
          <AELabel
            header={t('AttendeeNotTurnedOnCamera')}
            variant={'heading3'}
            className={'justify-content-center'}
            color="#9e9e9e"
          />
        </div>
      ) : null}
    </div>
  );
}
