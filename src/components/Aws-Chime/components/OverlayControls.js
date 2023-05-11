import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import AEIcons from '../../../Core/Icon/index';
import useAttendee from '../hooks/useAttendee';
import { ModeratedSessions } from '../enums/MeetingConstant';

function OverlayControls(props) {
  const chime = useContext(getChimeContext());
  const { t } = useTranslation('chime');
  const attendee = useAttendee(props.attendeeId);

  const isModeratedSession = ModeratedSessions.includes(chime.isFrom);
  return (
    <div className="overlay-wrapper">
      <div className="control-wrapper">
        {chime.attendeeId !== props.attendeeId && isModeratedSession && (
          <div className="control">
            {!attendee.muted ? (
              <AEIcons
                svgIcon="virtual-icon-bar-microphone-unmute"
                viewBox="0 0 28 28"
                dataPrefix="fas"
                dataIcon="microphone"
                size="small"
                className="cursor"
                onClick={() => {
                  if (chime.isModerator) {
                    chime.sendMessage(props.attendeeId, {
                      type: 'MUTE',
                    });
                  } else {
                    props.showMessage(t('PermissionDeniedYouAreNotModerator'), true);
                  }
                }}
              />
            ) : (
              <AEIcons
                className="cursor"
                svgIcon="virtual-icon-bar-microphone-mute"
                viewBox="0 0 28 28"
                size="small"
                dataPrefix="fas"
                dataIcon="microphone-slash"
                onClick={() => {
                  if (chime.isModerator) {
                    chime.sendMessage(props.attendeeId, {
                      type: 'UNMUTE',
                    });
                  } else {
                    props.showMessage(t('PermissionDeniedYouAreNotModerator'), true);
                  }
                }}
              />
            )}
          </div>
        )}
        <div className="control">
          <AEIcons
            className="cursor pin-icon"
            svgIcon={attendee.isPin ? 'virtual-icon-unpin' : 'virtual-icon-pin'}
            viewBox="0 0 28 28"
            dataPrefix="fas"
            dataIcon="pin"
            size="small"
            onClick={() => {
              chime.updateRosterPin(props.attendeeId, {
                type: attendee.isPin ? 'ISUNPIN' : 'ISPIN',
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default OverlayControls;
