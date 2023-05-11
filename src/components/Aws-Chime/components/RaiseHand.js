import React, { useState, useContext, useEffect, memo } from 'react';
import { xor, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import { IsFrom, MessageTopic } from '../enums/MeetingConstant';
import getChimeContext from '../context/getChimeContext';
import AETooltip from '../../../Core/Tooltip';
import useAttendees from '../hooks/useAttendees';
import usePrevious from '../../../hooks/usePrevious';
import AEButton from '../../../Core/Button/Button';
import useRaisedHandAttendees from '../hooks/useRaisedHandAttendees';
import AEIcons from '../../../Core/Icon/index';

const RaiseHand = () => {
  const raisedHandAttendees = useRaisedHandAttendees();
  const chime = useContext(getChimeContext());
  const roster = useAttendees();
  const { t } = useTranslation('controller');
  const [isHandRaised, setIsHandRaised] = useState(false);
  //  remeber previous roster
  const prevRoster = usePrevious(Object.keys(roster));

  useEffect(() => {
    //  check if there is any change in roster
    const currentRoster = Object.keys(roster);
    const diff = xor(currentRoster, prevRoster);
    if (
      diff.length &&
      /* 
        only attendee has raised hand & some new joins (increase in roster) 
      */
      isHandRaised &&
      size(currentRoster) > size(prevRoster) &&
      (chime.isFrom === IsFrom.WORKSHOP ||
        chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ||
        chime.isFrom === IsFrom.NETWORKING_LOUNGE ||
        chime.isFrom === IsFrom.PIP_MODE_CHIME_MEETING)
    ) {
      /*
        when roster is updated (means any attendee joins or rejoins) broadcast message
        related to current users' status to all roster users
      */
      chime.sendRaiseHandMessage(MessageTopic.RaiseHand, chime.attendeeId);
    }
  }, [chime.audioVideo, prevRoster, roster, isHandRaised, chime.attendeeId, chime.isFrom]);

  useEffect(() => {
    setIsHandRaised(raisedHandAttendees.has(chime.attendeeId));
  }, [raisedHandAttendees]);

  return (
    (chime.isFrom === IsFrom.WORKSHOP ||
      chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ||
      chime.isFrom === IsFrom.NETWORKING_LOUNGE) && (
      <AETooltip
        tooltip={isHandRaised ? t('ClickHereToHandDown') : t('ClickHereToRaiseHand')}
        placement={'top'}
        overlayProps={{ placement: 'top' }}
      >
        <div>
          <AEButton
            type="button"
            id="workshopHand"
            onClick={() => {
              chime.sendRaiseHandMessage(
                isHandRaised ? MessageTopic.DismissHand : MessageTopic.RaiseHand,
                chime.attendeeId,
              );
              setIsHandRaised(!isHandRaised);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                chime.sendRaiseHandMessage(
                  isHandRaised ? MessageTopic.DismissHand : MessageTopic.RaiseHand,
                  chime.attendeeId,
                );
                setIsHandRaised(!isHandRaised);
              }
            }}
            aria-label={isHandRaised ? 'Click here to hand down' : 'Click here to raise hand'}
          >
            {raisedHandAttendees.has(chime.attendeeId) ? (
              <AEIcons
                svgIcon="virtual-icon-raise-hand"
                size="small"
                color="#FEBF15"
                className="raisedHand ml-0"
                viewBox="0 0 28 28"
              />
            ) : (
              <AEIcons svgIcon="virtual-icon-raise-hand" size="small" className="downHand" viewBox="0 0 28 28" />
            )}
          </AEButton>
        </div>
      </AETooltip>
    )
  );
};

export default memo(RaiseHand);
