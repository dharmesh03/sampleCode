import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import cx from 'classnames';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import getChimeContext from '../context/getChimeContext';
import AESpinner from '../../../Core/Spinner/Spinner';
import { IsFrom, MessageTopic, Status, ViewMode } from '../enums/MeetingConstant';
import { doCheckBreakoutRoomPresent, doGetBreakoutRooms } from '../../../routes/event/portal/Workshop/action';
import Error from './Error';
import Roster from './Roster';
import TileLayout from './TileLayout';
import Controls from './Controls';
import MeetingAlerts from './MeetingAlerts';
import { getLocalStorage } from '../../Widget/Utility/Utility';
import { ContentShareProvider } from '../providers/ContentShareProvider';
import { getTimeInLocal } from '../../../routes/event/action';

let isMeetingLeft = false;
function PipChimeMeeting(props) {
  const { userRoleDetails, eventData, pipModeVideo, user } = props;
  const { eventURL } = eventData || {};
  const { videoCurrentURL, isFromPip, loungeData, session, roomId, isCamEnabled, isMicMuted } = pipModeVideo || {};
  const chime = useContext(getChimeContext());
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });
  const [viewMode] = useState(ViewMode.Room);
  const [isContentShareEnabled, setIsContentShareEnabled] = useState(false);
  const [meetingAlerts, setMeetingAlerts] = useState({ message: '' });

  const { t } = useTranslation(['chime', 'common']);

  const audioElement = useRef(null);
  const isSpeakerInSession = () => session?.speakerList?.find((speaker) => speaker?.userId === user?.userId);
  const isModerator = (userRoleDetails && (userRoleDetails.admin || userRoleDetails.staff)) || isSpeakerInSession();

  const getBreakOutRoomData = () => {
    const { sessionId } = session;
    if (sessionId) {
      props.doGetBreakoutRooms(eventURL, sessionId);
    }
  };

  useEffect(() => {
    if (isFromPip === IsFrom.WORKSHOP) {
      getBreakOutRoomData();
    }
  }, []);

  const realtimeSubscribeToReceiveGeneralDataMessage = async () => {
    chime.audioVideo &&
      (await chime.audioVideo.realtimeSubscribeToReceiveDataMessage(MessageTopic.GeneralDataMessage, async (data) => {
        try {
          const receivedData = (data && data.json()) || {};
          const { type, attendeeId } = receivedData || {};
          if (attendeeId === chime.attendeeId) return;
          if (type === 'MUTEALL' || (!isModerator && type === 'MUTE-ATTENDEES')) {
            chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
          } else if (type === 'STOPALLVIDEO') {
            chime.audioVideo && (await chime.audioVideo.stopVideoInput());
          } else if (type === 'UPDATE-BREAKOUT-ROOM') {
            props.doGetBreakoutRooms(eventURL, session.sessionId);
          }
        } catch (err) {
          chime.setStreamLog(err.stack);
        }
      }));
  };

  const showMessage = (message, isError) => {
    props.showAlert({ message, success: !isError });
  };

  const joinMeeting = async () => {
    chime.audioVideo && (await chime.audioVideo.start());
    await new Promise((resolve) => setTimeout(resolve, 2500));
    realtimeSubscribeToReceiveGeneralDataMessage();
    chime.storeSelectedDevices();
    if (isCamEnabled) {
      // Delayed for a while to join meeting successfully with devices readiness
      await new Promise((resolve) => setTimeout(resolve, 200));

      const vbData =
        getLocalStorage('virtualBackgroundEffect') !== undefined && getLocalStorage('virtualBackgroundEffect') !== null
          ? getLocalStorage('virtualBackgroundEffect')
          : null;

      // eslint-disable-next-line
      if (vbData && eventData.eventId == vbData.eventId && user.userId == vbData.userId) {
        await chime.setVirtualBackgroundEffect(vbData.effectType, vbData.value, eventData.eventId, user.userId);
      } else {
        chime.audioVideo && (await chime.audioVideo.startLocalVideoTile());
      }
    } else {
      await chime?.joinWithOffCamera();
    }
    if (isMicMuted) {
      chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
    }
    chime.refreshAudioInputDevice();
  };

  const handleMeetingRoom = async () => {
    if (isFromPip === IsFrom.WORKSHOP) {
      await chime.createWorkshopRoom(session.sessionId, eventURL, IsFrom.PIP_MODE_CHIME_MEETING, isModerator);
    }
    if (isFromPip === IsFrom.NETWORKING_LOUNGE) {
      await chime.createNetworkingLoungeRoom(loungeData.id, eventURL, IsFrom.PIP_MODE_CHIME_MEETING, isModerator);
    }
    if (isFromPip === IsFrom.WORKSHOP_BREAKOUTROOM) {
      await chime.createWorkshopBreakoutRoom(
        session.sessionId,
        roomId,
        eventURL,
        IsFrom.PIP_MODE_CHIME_MEETING,
        isModerator,
      );
    }
  };

  const observer = {
    audioVideoDidStop: async (status) => {
      const sessionStatus = await chime.getChimeMeetingStatus(status);
      const callBack = async () => {
        if (sessionStatus.status === 'AudioJoinedFromAnotherDevice') {
          setMeetingStatus({
            status: 'Failed',
            errorMessage: 'The attendee joined from another device.',
          });
        } else if (
          sessionStatus.status === 'TaskFailed' ||
          sessionStatus.status === 'SignalingBadRequest' ||
          sessionStatus.status === 'TURNCredentialsForbidden' ||
          sessionStatus.status === 'RealtimeApiFailed'
        ) {
          if (
            isMeetingLeft ||
            !get(location, 'pathname', '').includes(`/workshops/${session.sessionId}`) ||
            !get(location, 'pathname', '').includes(`/lounge/${loungeData.id}`)
          )
            return;
          try {
            setMeetingAlerts({ message: sessionStatus.message, autoHide: false, type: 'error', loading: true });
            await chime.leaveRoom(eventURL);
            await handleMeetingRoom();
            setMeetingStatus({ status: 'Succeeded' });
            chime.audioVideo && chime.audioVideo.addObserver(observer);
            await chime.joinRoom(audioElement, true);
            await joinMeeting();
          } catch (err) {
            setMeetingAlerts({
              message: '',
              autoHide: true,
              type: 'error',
              loading: false,
            });
            setMeetingStatus({
              status: 'Failed',
              errorMessage: 'Failed to join the meeting.',
            });
          }
        } else if (sessionStatus.status === 'Left') {
          showMessage(t('PIP mode meeting ended successfully'), false);
        } else {
          showMessage(t(sessionStatus.message), true);
        }
      };
      if (roomId) {
        props
          .doCheckBreakoutRoomPresent(eventURL, session.sessionId, roomId)
          .then(async (res) => {
            if (res && res.data) {
              callBack();
            } else {
              setMeetingStatus({
                status: 'Failed',
                errorMessage: 'BreakoutRoomNotExistOrDeleted',
              });
            }
          })
          .catch(() => {});
      } else {
        callBack();
      }
    },
    audioVideoDidStartConnecting: (reconnecting) => {
      if (reconnecting) {
        setMeetingAlerts({
          message: 'You lost your network connection. Trying to reconnect.',
          autoHide: false,
          type: 'error',
          loading: true,
        });
      } else {
        setMeetingStatus({ status: 'Succeeded' });
      }
    },
    audioVideoDidStart: async () => {
      setMeetingAlerts({ message: '', autoHide: true, type: 'success' });
    },
    connectionDidBecomePoor: () => {
      setMeetingAlerts({ message: 'Slow network connection detected.', autoHide: true, type: 'warning' });
    },
    connectionDidSuggestStopVideo: () => {
      setMeetingAlerts({
        message: 'Slow network connection detected. We recommend to turn off your video.',
        autoHide: true,
        type: 'warning',
      });
    },
  };

  const initializeMeeting = async () => {
    try {
      await handleMeetingRoom();
      setMeetingStatus({
        status: 'Succeeded',
      });
      chime.audioVideo && chime.audioVideo.addObserver(observer);
      await chime.joinRoom(audioElement);
      await joinMeeting();
    } catch (error) {
      console.error(error);
      setMeetingStatus({
        status: 'Failed',
        errorMessage: error.message,
      });
    }
  };

  useEffect(() => {
    if ((loungeData || session || roomId) && eventData) {
      initializeMeeting();
    }
    return async () => {
      // Return back to main session & check if virtual background exists
      await chime.leaveRoom(eventURL);
      props.handlePipModeVideo();
    };
  }, []);

  const handleLeavePip = async () => {
    isMeetingLeft = true;
    setMeetingStatus({
      status: 'Loading',
      errorMessage: '',
    });
    chime.audioVideo && chime.audioVideo.removeObserver(observer);

    const equivalentTimezone = (eventData && eventData.equivalentTimezone) || 'US/Eastern';
    const isSessionEnded = getTimeInLocal(session?.endTime, equivalentTimezone).diff(moment(), 'seconds') <= 0;
    const isSessionLive = session
      ? getTimeInLocal(session.startTime, equivalentTimezone).diff(moment(), 'seconds') <= 0 &&
        getTimeInLocal(session.endTime, equivalentTimezone).diff(moment(), 'seconds') >= 0
      : false;
    // Return back to main session & check if virtual background exists
    await chime.leaveRoom(eventURL);
    props.isPipMode({ ...pipModeVideo, isChimeMeetingPipMode: false, showPipModeVideo: false, needToredirect: 5 });

    // if session is live then it will be redirected to mentioned path
    if (session && !isSessionEnded && isSessionLive) {
      props.history.push(`${videoCurrentURL}?showJoin=false&tab=5`);
    }
  };

  const onLeavePipSession = async (withEndSession = true, removeFromSession, _isFrom) => {
    if (chime && withEndSession) {
      // Back to main session
      await chime.leaveRoom(eventURL);
      _isFrom === IsFrom.PIP_MODE_CHIME_MEETING &&
        removeFromSession &&
        ((isFromPip === IsFrom.WORKSHOP && props.history.push(`/e/${eventURL}/portal/workshops`)) ||
          (isFromPip === IsFrom.NETWORKING_LOUNGE && props.history.push(`/e/${eventURL}/portal/lounge`)));
    }

    if (isFromPip === IsFrom.NETWORKING_LOUNGE && videoCurrentURL === window.location.pathname) {
      props.history.push(`/e/${eventURL}/portal/lounge/${loungeData.id}`);
    } else if (isFromPip === IsFrom.WORKSHOP_BREAKOUTROOM && videoCurrentURL === window.location.pathname) {
      props.history.push(`/e/${eventURL}/portal/workshops/${session.sessionId}?showJoin=false`);
    }
  };

  const handlePipClose = async (removeFromSession = false) => {
    isMeetingLeft = true;
    const _isFrom = chime.isFrom;
    await chime.leaveRoom(eventURL);
    props.isPipMode({
      showPipModeVideo: false,
      isChimeMeetingPipMode: false,
      needToredirect: 1,
    });
    await onLeavePipSession(true, removeFromSession, _isFrom);
  };

  const resetMeetingAlert = () => setMeetingAlerts({ message: '' });

  const joinBreakoutRoom = async (roomId) => {
    isMeetingLeft = true;
    await chime.leaveRoom(eventURL);
    await new Promise((resolve) => setTimeout(resolve, 200));
    props.history.push(`/e/${eventURL}/portal/workshops/${session.sessionId}/breakoutRoom/${roomId}`);
    await props.isPipMode({ isChimeMeetingPipMode: false, showPipModeVideo: false });
  };

  const onContentShareEnabled = (isContentShareEnabled) => {
    setIsContentShareEnabled(isContentShareEnabled);
  };

  return (
    <ContentShareProvider>
      <div className="pip-chime-meeting">
        <div className="chime" id="chime-meeting-wrapper">
          <audio ref={audioElement} className="d-none" />
          <MeetingAlerts {...meetingAlerts} onClose={resetMeetingAlert} />
          <div className="pip-chime pip-d-mode">
            <div className="pip-close-block">
              <span
                onClick={() => handlePipClose()}
                onKeyDown={(e) => e.key === 'Enter' && handlePipClose()}
                tabIndex="0"
                role="button"
                className="hover_focus_effect_1"
                aria-label="Click to close pipmode"
              >
                <i className="ac-icon-close" id="pipModeCloseIcon" />
              </span>
            </div>
            <div
              className={cx(
                'classroom',
                {
                  roomMode: viewMode === ViewMode.Room,
                  screenShareMode: viewMode === ViewMode.ScreenShare,
                  isContentShareEnabled,
                },
                meetingStatus.status === Status.Loading && 'd-flex justify-content-center align-items-center',
              )}
            >
              <>
                {meetingStatus.status === Status.Loading && (
                  <AESpinner type="SpinnerSmall" style={{ margin: 'auto' }} />
                )}
                {meetingStatus.status === Status.Failed && (
                  <Error
                    btnText={t('LeaveBreakout')}
                    errorMessage={t(meetingStatus.errorMessage)}
                    onLeave={() => handlePipClose(false)}
                  />
                )}
                {meetingStatus.status === Status.Succeeded && (
                  <>
                    <div className={cx('left')}>
                      <TileLayout
                        isContentShareEnabled={isContentShareEnabled}
                        viewMode={viewMode}
                        isFromChimePIPMode
                      />
                      <div className="localVideo-box">
                        <div className="controls text-center">
                          <div className="control-bar">
                            <Controls
                              viewMode={viewMode}
                              leavePipModeMeeting={handleLeavePip}
                              isContentShareEnabled={isContentShareEnabled}
                              onContentShareEnabled={onContentShareEnabled}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={'d-none'}>
                      <div className="roster-box dropdown-bg-remove">
                        <Roster
                          showMessage={showMessage}
                          leaveMeeting={(removeFromSession) => handlePipClose(removeFromSession)}
                          joinBreakoutRoom={joinBreakoutRoom}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            </div>
          </div>
        </div>
      </div>
    </ContentShareProvider>
  );
}

const mapDispatchToProps = { doCheckBreakoutRoomPresent, doGetBreakoutRooms };
const mapStateToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(PipChimeMeeting));
