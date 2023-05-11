import React, { useState, useEffect, useContext } from 'react';
import moment from 'moment-timezone';
import cx from 'classnames';
import { ResizeObserver } from 'resize-observer';
import { debounce } from 'throttle-debounce';
import { useTranslation } from 'react-i18next';
import useRosterCount from '../hooks/useRosterCount';
import AETooltip from '../../../Core/Tooltip';
import AEIcons from '../../../Core/Icon/index';
import { getTimeInLocal } from '../../../routes/event/action/index';
import getChimeContext from '../context/getChimeContext';

let countDownInterval;
let resizeObserver;
function ChimeHeader(props) {
  const attendeCount = useRosterCount();
  const {
    meetingName,
    meetingStartTime,
    meetingEndTime,
    equivalentTimezone,
    toggleSettingsSideBar,
    timerBefore = 0,
    isFrom,
    recordSession,
  } = props || {};
  const [showTimer, setShowTimer] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const chime = useContext(getChimeContext());

  const { t } = useTranslation(['tooltipMsg', 'common']);

  const meetingTimer = (meetingStartTime, meetingEndTime) => {
    const sessionStartTime = getTimeInLocal(meetingStartTime, equivalentTimezone || 'US/Eastern');
    const sessionEndTime = getTimeInLocal(meetingEndTime, equivalentTimezone || 'US/Eastern');
    clearTimeout(countDownInterval);
    countDownInterval = setInterval(async () => {
      if (moment(sessionStartTime).diff(moment()) < timerBefore && moment(sessionEndTime).diff(moment()) > 0) {
        const days = moment(sessionEndTime).diff(moment(), 'days');
        const hours = moment(sessionEndTime).add(-days, 'days').diff(moment(), 'hours');
        const minute = moment(sessionEndTime).add(-days, 'days').add(-hours, 'hours').diff(moment(), 'minutes');
        const seconds = moment(sessionEndTime)
          .add(-days, 'days')
          .add(-hours, 'hours')
          .add(-minute, 'minutes')
          .diff(moment(), 'seconds');

        setHours(hours <= 0 ? '00' : hours <= 9 ? `0${hours}`.slice(-2) : hours);
        setMinutes(minute <= 0 ? '00' : minute <= 9 ? `0${minute}`.slice(-2) : minute);
        setSeconds(seconds <= 0 ? '00' : seconds <= 9 ? `0${seconds}`.slice(-2) : seconds);
        setShowTimer(true);
      } else if (moment(sessionEndTime).diff(moment()) < 0) {
        setShowTimer(true);
        setHours('00');
        setMinutes('00');
        setSeconds('00');
        clearTimeout(countDownInterval);
      } else {
        setShowTimer(false);
      }
    }, 1000);
  };

  const handleChimeHeaderSticky = () => {
    const centerBlock = document.querySelector('.chime')?.getBoundingClientRect();
    const header = document.querySelector('#portal-header').getBoundingClientRect();
    if (centerBlock) {
      const chimeHeader = document.querySelector('#chime-header-fixed');
      if (chimeHeader) {
        chimeHeader.style.top = `${header.height}px`;
      }
    }
  };

  useEffect(() => {
    if (isFrom !== 'LiveForum') {
      const centerBlock = document.querySelector('#portal-content-wrapper');
      window.addEventListener('resize', handleChimeHeaderSticky());
      const handleResize = debounce(0, () => {
        handleChimeHeaderSticky();
      });
      resizeObserver = new ResizeObserver(handleResize);
      if (centerBlock) resizeObserver.observe(centerBlock);
    }
    if (meetingStartTime && meetingEndTime) {
      meetingTimer(meetingStartTime, meetingEndTime);
    }
    return () => {
      const centerBlock = document.querySelector('#portal-content-wrapper');
      if (resizeObserver && centerBlock) resizeObserver.unobserve(centerBlock);
      if (countDownInterval) {
        clearTimeout(countDownInterval);
        countDownInterval = null;
      }
    };
  }, [meetingStartTime, meetingEndTime]);

  const toggle = () => {
    const btn = document.getElementById('open_device_settings');
    if (btn) {
      btn.click();
    }
  };

  return (
    <div
      className={cx('chime-header-panel responsive-header', isFrom !== 'LiveForum' && 'sticky-chime-header')}
      id="chime-header-fixed"
    >
      <div className="width-100-percent">
        <div className="row d-flex">
          <div className="col-lg-6 session-name-workshop p-t-b-5">
            {(meetingName || isFrom === 'BreakoutRoom') && (
              <div className="name-block">
                <AETooltip
                  isText
                  tooltip={isFrom === 'BreakoutRoom' ? chime.title : meetingName}
                  overlayProps={{ placement: 'top' }}
                  className=""
                >
                  <div className="meeting-name-badge active-count">
                    {isFrom === 'BreakoutRoom' ? chime.title || '' : meetingName || ''}
                  </div>
                </AETooltip>
              </div>
            )}
          </div>
          <div className="session-time-member p-t-b-5">
            <div className="d-inline-flex pull-right">
              {isFrom === 'Workshop' && recordSession && (
                <div className="meeting-name-badge d-flex m-r-10">
                  <div className="time d-inline-flex" id="recordIcon">
                    <AEIcons color={'none'} svgIcon="record-icon" />
                  </div>
                  <div>{t('common:Recording')}</div>
                </div>
              )}
              {showTimer && (
                <div className="meeting-name-badge d-flex text-center">
                  <i className="ac-icon-time time" id="timerIcon" />
                  <span className="timer-width" id="timer">
                    {hours || '0'}:{minutes || '0'}:{seconds || '00'}
                  </span>
                </div>
              )}
              <div
                className="meeting-name-badge d-flex m-l-10 cursor"
                onClick={() => {
                  if (isFrom !== 'LiveForum') {
                    toggle();
                  } else {
                    toggleSettingsSideBar();
                  }
                }}
              >
                <AETooltip
                  tooltip={t('ActiveAttendees')}
                  tooltipProps={{ id: 'userCount' }}
                  overlayProps={{ placement: 'top' }}
                >
                  <AEIcons size="exSmall" className="icons fa fa-user" id="userIcon" />
                  <span className="m-l-5" id="attendeeCount">
                    {attendeCount || 0}
                  </span>
                </AETooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChimeHeader;
