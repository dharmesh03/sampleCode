import cx from 'classnames';
import get from 'lodash/get';
import moment from 'moment-timezone';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import Controls from './Controls';
import Error from './Error';
import CustomControls from './CustomControls';
import Roster from './Roster';
import DeviceSelection from './NewDeviceSelection';
import {
  getUserRoleDetails,
  isPipMode as isPipModeVideoDetail,
} from '../../../routes/event/action/selectorVirtualEvent';
import { getUserSession } from '../../../routes/login/action/selector';
import { ViewMode, Status, IsFrom, MessageTopic } from '../enums/MeetingConstant';
import { storeWarnUserOnPageLeave } from '../../../routes/admin/action';
import LeaveConfirmationPopup from './LeaveConfirmationPopup';
import WithParams from '../../WrapperComponents/WithParams';
import AESpinner from '../../../Core/Spinner/Spinner';
import { isPipMode, showAlert } from '../../../routes/event/action/portalAction';
import MeetingAlerts from './MeetingAlerts';
import BreakoutItemView from './BreakoutItemView';
import { getTimeInLocal } from '../../../routes/event/action';
import { doCheckBreakoutRoomPresent } from '../../../routes/event/portal/Workshop/action';
import TileLayout from './TileLayout';
import AEPopup from '../../../Core/Popup';
import useAnaylics from '../hooks/useAnaylitics';
import { getLocalStorage } from '../../Widget/Utility/Utility';
import { ContentShareProvider, ContentShareErrorType } from '../providers/ContentShareProvider';
import useIsMounted from '../../../hooks/useIsMounted';

let isMeetingLeft = false;
let isPipModeOpen = false;
function BreakoutRoom(props) {
  const {
    user,
    session,
    userRoleDetails,
    params,
    pipModeVideo,
    eventData,
    getStatus,
    warnUserOnStateUpdate,
    userTicketTypeIds,
    pushDataToKinesis,
  } = props;
  const { equivalentTimezone } = eventData || {};
  const { showPipModeVideo, roomId: pipRoomId } = pipModeVideo || {};
  const chime = useContext(getChimeContext());
  useAnaylics({ eventData, session, user, userTicketTypeIds, pushDataToKinesis, isFrom: IsFrom.WORKSHOP });
  const [viewMode, setViewMode] = useState('Room');
  const [isModeTransitioning] = useState(false);
  const [isContentShareError, setIsContentShareError] = useState(false);
  const [isContentShareEnabled, setIsContentShareEnabled] = useState(false);
  const [showChimeSideBar, setShowChimeSideBar] = useState(false);
  const [showDeviceSwitcherPopup, setShowDeviceSwitcherPopup] = useState(false);
  const [showBreakoutSideBar, setShowBreakoutSideBar] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });
  const [meetingAlerts, setMeetingAlerts] = useState({ message: '' });
  const [leaveConfirmationPopup, setLeaveConfirmationPopup] = useState(false);

  const { t } = useTranslation(['chime', 'common', 'controller']);
  const isMounted = useIsMounted();

  const audioElement = useRef(null);

  const isSpeakerInSession = () => {
    const { speakerList } = session || {};
    return user && speakerList && speakerList.filter((speaker) => speaker.userId === user.userId).length > 0;
  };
  const isModerator = (userRoleDetails && (userRoleDetails.admin || userRoleDetails.staff)) || isSpeakerInSession();

  const showMessage = (message, isError) => {
    props.showAlert({ message, success: !isError });
  };

  const realtimeSubscribeToReceiveGeneralDataMessage = async () => {
    chime.audioVideo &&
      (await chime.audioVideo.realtimeSubscribeToReceiveDataMessage(MessageTopic.GeneralDataMessage, async (data) => {
        try {
          const receivedData = (data && data.json()) || {};
          const { type, attendeeId } = receivedData || {};
          if (attendeeId !== chime.attendeeId && (type === 'MUTEALL' || (!isModerator && type === 'MUTE-ATTENDEES'))) {
            chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
          } else if (attendeeId !== chime.attendeeId && type === 'STOPALLVIDEO') {
            chime.audioVideo && (await chime.audioVideo.stopVideoInput());
            // chime.audioVideo.removeLocalVideoTile();
          } else if (type === 'DELETE-ROOM') {
            await chime.leaveRoom(params.params);
            setMeetingStatus({
              status: 'Failed',
              errorMessage: 'BreakoutRoomNotExistOrDeleted',
            });
            getStatus('Failed');
          } else if (type === 'ATTENDEEPROFILE') {
            chime.updateAttendeeProfile(receivedData);
          }
        } catch (err) {
          chime.setStreamLog(err.stack);
        }
      }));
  };

  const joinMeeting = async () => {
    if (!isMounted?.current) {
      await chime.leaveRoom(params.params);
      return;
    }
    props.storeWarnUserOnPageLeave({ stateUpdated: true, showPopupForSaveSetting: false, selectedLink: '' });
    setShowDeviceSwitcherPopup(false);
    chime.audioVideo && (await chime.audioVideo.start());
    await new Promise((resolve) => setTimeout(resolve, 2500));
    realtimeSubscribeToReceiveGeneralDataMessage();
    if (isModerator) {
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

    await chime.refreshAudioInputDevice();
    if (!isModerator) {
      chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
    }
    if (pipModeVideo) {
      props.isPipMode({ isChimeMeetingPipMode: false, showPipModeVideo: false });
    }
    setTimeout(() => {
      chime.sendMessage(MessageTopic.GeneralDataMessage, {
        type: 'ATTENDEEPROFILE',
        profilePic: chime?.attendees[chime?.attendeeId]?.profilePic,
        firstName: chime?.attendees[chime?.attendeeId]?.firstName,
        lastName: chime?.attendees[chime?.attendeeId]?.lastName,
      });
    }, 2000);
  };

  const onCloseDeviceSwitcherPopup = async () => {
    setShowDeviceSwitcherPopup(false);
    await chime.leaveRoom(params.params);
    props.history.goBack();
  };

  const reconnectOnSdkError = async (sessionStatus) => {
    if (sessionStatus.status === 'AudioJoinedFromAnotherDevice') {
      setMeetingStatus({
        status: 'Failed',
        errorMessage: sessionStatus.message,
      });
      getStatus('Failed');
    } else if (
      sessionStatus.status === 'TaskFailed' ||
      sessionStatus.status === 'SignalingBadRequest' ||
      sessionStatus.status === 'TURNCredentialsForbidden' ||
      sessionStatus.status === 'AudioCallEnded' ||
      sessionStatus.status === 'RealtimeApiFailed'
    ) {
      if (isMeetingLeft) return;
      try {
        setMeetingAlerts({ message: sessionStatus.message, autoHide: false, type: 'error', loading: true });
        await chime.leaveRoom(params.params);
        await chime.createWorkshopBreakoutRoom(
          session.sessionId,
          params.roomId,
          params.params,
          IsFrom.WORKSHOP_BREAKOUTROOM,
          isModerator,
        );

        setMeetingStatus({ status: 'Succeeded' });
        getStatus('Succeeded');
        // eslint-disable-next-line no-use-before-define
        chime.audioVideo && chime.audioVideo.addObserver(observer);
        await chime.joinRoom(audioElement, true);
        if (!showDeviceSwitcherPopup) {
          await joinMeeting();
        }
      } catch (err) {
        setMeetingAlerts({
          message: '',
          autoHide: true,
          type: 'error',
          loading: false,
        });
        setMeetingStatus({
          status: 'Failed',
          errorMessage: (err && err.message) || 'FailedToJoinMeeting',
        });
        getStatus('Failed');
      }
    } else if (sessionStatus.status === 'Left') {
      showMessage(isPipModeOpen ? t('Meeting joining in PIP mode') : t('MeetingEndedSuccessfully'), false);
    } else {
      showMessage(t(sessionStatus.message), true);
    }
  };

  const observer = {
    audioVideoDidStop: async (status) => {
      const sessionStatus = await chime.getChimeMeetingStatus(status);
      props
        .doCheckBreakoutRoomPresent(params.params, session.sessionId, params.roomId)
        .then((res) => {
          if (res && res.data) {
            reconnectOnSdkError(sessionStatus);
          } else {
            setMeetingStatus({
              status: 'Failed',
              errorMessage: 'BreakoutRoomNotExistOrDeleted',
            });
            getStatus('Failed');
          }
        })
        .catch(() => {});
    },
    audioVideoDidStartConnecting: (reconnecting) => {
      if (reconnecting) {
        setMeetingAlerts({
          message: 'LostNetworkTryingToReconnet',
          autoHide: false,
          type: 'error',
          loading: true,
        });
      } else {
        setMeetingStatus({ status: 'Succeeded' });
        getStatus('Succeeded');
      }
    },
    audioVideoDidStart: async () => {
      setMeetingAlerts({ message: '', autoHide: true, type: 'success' });
    },
    connectionDidBecomePoor: () => {
      setMeetingAlerts({ message: 'SlowNetworkDetected', autoHide: true, type: 'warning' });
    },
    connectionDidSuggestStopVideo: () => {
      setMeetingAlerts({
        message: 'SlowNetWorkRecommendToTurnOffVideo',
        autoHide: true,
        type: 'warning',
      });
    },
  };

  const redirectOnLeave = async () => {
    const { sessionId, endTime } = session || {};
    await new Promise((resolve) => setTimeout(resolve, 200));
    const isSessionEnded = getTimeInLocal(endTime, equivalentTimezone).diff(moment(), 'seconds') <= 0;
    if (isSessionEnded) {
      props.history.push(`/e/${params.params}/portal/workshops`);
      return;
    }
    props.history.push(`/e/${params.params}/portal/workshops/${sessionId}?showJoin=false`);
  };

  const leaveWorkshopBreakoutRoom = async (withEndSession = true) => {
    isMeetingLeft = true;
    setMeetingStatus({
      status: 'Loading',
      errorMessage: '',
    });
    getStatus('Loading');
    chime.audioVideo && chime.audioVideo.removeObserver(observer);
    if (withEndSession) {
      // Leaving from breakout room to main session passing TRUE as 2nd arg
      await chime.leaveRoom(params.params);
    }

    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
    if (warnUserOnStateUpdate && !warnUserOnStateUpdate.selectedLink) {
      redirectOnLeave();
    }
  };

  const initializeMeeting = async () => {
    if (!isMounted?.current) return;
    isPipModeOpen = false;

    if (warnUserOnStateUpdate && warnUserOnStateUpdate.stateUpdated) {
      props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
    }
    try {
      await chime.createWorkshopBreakoutRoom(
        session.sessionId,
        params.roomId,
        params.params,
        IsFrom.WORKSHOP_BREAKOUTROOM,
        isModerator,
      );
      setMeetingStatus({ status: 'Succeeded' });
      getStatus('Succeeded');
      chime.audioVideo && chime.audioVideo.addObserver(observer);
      await chime.joinRoom(audioElement);
      await joinMeeting();
    } catch (error) {
      setMeetingStatus({
        status: 'Failed',
        errorMessage: (error && error.message) || 'FailedToJoinMeeting',
      });
      getStatus('Failed');
    }
  };

  const handlePipMode = async () => {
    const isMicMuted = chime.isAttendeeMuted(chime.attendeeId);
    const isCamEnabled = chime.audioVideo.hasStartedLocalVideoTile() || false;
    isPipModeOpen = true;
    setMeetingStatus({
      status: 'Loading',
      errorMessage: '',
    });
    getStatus('Loading');

    // Leaving for PIP mode from breakout room
    await chime.leaveRoom(params.params);
    await new Promise((resolve) => setTimeout(resolve, 200));
    props.isPipMode({
      session,
      roomId: params.roomId,
      isChimeMeetingPipMode: true,
      showPipModeVideo: true,
      videoCurrentURL: window.location.pathname,
      isFromPip: IsFrom.WORKSHOP_BREAKOUTROOM,
      isCamEnabled,
      isMicMuted,
    });
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
  };

  useEffect(() => {
    if (!showPipModeVideo && session && params?.roomId) {
      initializeMeeting();
    }
    if (!showPipModeVideo) {
      props.handleRedirectHistory();
    }
    return async () => {
      if (!showPipModeVideo) {
        isMeetingLeft = true;
        await chime.leaveRoom(params.params);
        props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
      }
    };
  }, [showPipModeVideo, params.roomId]);

  useEffect(() => {
    setMeetingAlerts({
      message:
        isContentShareError?.type === ContentShareErrorType.NOT_SUPPORTED
          ? t('BrowserNotSupportScreenShare')
          : isContentShareError?.message,
      type: isContentShareError?.level,
    });
  }, [isContentShareError]);

  const resetMeetingAlert = () => setMeetingAlerts({ message: '' });

  const onContentShareEnabled = (isContentShareEnabled) => {
    setIsContentShareEnabled(isContentShareEnabled);
  };

  const onContentShareError = (isContentShareError) => {
    setIsContentShareError(isContentShareError);
  };

  return (
    <ContentShareProvider>
      <div className={cx('chime breakout-room', meetingStatus.status === Status.Succeeded && 'm-top')}>
        <audio ref={audioElement} className="d-none" />
        <MeetingAlerts {...meetingAlerts} onClose={resetMeetingAlert} />
        <div
          className={cx('classroom', {
            roomMode: viewMode === ViewMode.Room,
            screenShareMode: viewMode === ViewMode.ScreenShare,
            isModeTransitioning,
            isContentShareEnabled,
          })}
        >
          {!showPipModeVideo ? (
            <>
              {meetingStatus.status === Status.Loading && <AESpinner type="SpinnerSmall" />}
              {meetingStatus.status === Status.Failed && (
                <Error
                  btnText={t('LeaveBreakout')}
                  errorMessage={t(meetingStatus.errorMessage)}
                  onLeave={() => leaveWorkshopBreakoutRoom(false)}
                />
              )}
              {meetingStatus.status === Status.Succeeded && (
                <>
                  <div className={cx('left', (showChimeSideBar || showBreakoutSideBar) && 'sidebar-toggle')}>
                    <TileLayout isContentShareEnabled={isContentShareEnabled} viewMode={viewMode} />
                    <div className="controls text-center">
                      <div className="control-bar">
                        <CustomControls
                          viewMode={viewMode}
                          onLayoutChange={() =>
                            setViewMode(viewMode === ViewMode.Room ? ViewMode.Featured : ViewMode.Room)
                          }
                          handlePipMode={handlePipMode}
                          eventId={eventData.eventId || null}
                          userId={user.userId || null}
                        >
                          <Controls
                            viewMode={viewMode}
                            toggleSettingsSideBar={() => {
                              setShowBreakoutSideBar(false);
                              setShowChimeSideBar(!showChimeSideBar);
                            }}
                            leaveWorkshopBreakoutRoom={() => leaveWorkshopBreakoutRoom(true)}
                            showMessage={showMessage}
                            toggleBreakoutSideBar={() => {
                              setShowChimeSideBar(false);
                              setShowBreakoutSideBar(!showBreakoutSideBar);
                            }}
                            eventId={eventData.eventId || null}
                            userId={user.userId || null}
                            onContentShareError={onContentShareError}
                            onContentShareEnabled={onContentShareEnabled}
                          />
                        </CustomControls>
                      </div>
                    </div>
                  </div>
                  <div className={cx(showChimeSideBar ? 'right' : 'd-none')}>
                    <div className="roster-box">
                      <Roster
                        showMessage={showMessage}
                        leaveMeeting={() => leaveWorkshopBreakoutRoom(true)}
                        toggleSettingsSideBar={() => {
                          setShowChimeSideBar(!showChimeSideBar);
                        }}
                        eventId={eventData.eventId || null}
                        userId={user.userId || null}
                      />
                    </div>
                  </div>
                  <div className={cx(showBreakoutSideBar ? 'right' : 'd-none')}>
                    {showBreakoutSideBar ? (
                      <BreakoutItemView
                        showMessage={showMessage}
                        eventUrl={params && params.params}
                        session={session}
                        toggleBreakoutSideBar={() => {
                          setShowBreakoutSideBar(false);
                        }}
                        roomId={params.roomId}
                        switchRoom={async (roomId) => {
                          setMeetingStatus({
                            status: 'Loading',
                            errorMessage: '',
                          });
                          getStatus('Loading');
                          await chime.leaveRoom(params && params.params);
                          await new Promise((resolve) => setTimeout(resolve, 500));
                          props.history.push(
                            `/e/${params && params.params}/portal/workshops/${params.sessionId}/breakoutRoom/${roomId}`,
                          );
                        }}
                      />
                    ) : (
                      <>
                        <i className="fa fa-picture-o fa-2x m-r-10" aria-hidden="true" />
                        <Error
                          errorMessage={
                            pipRoomId === params?.roomId
                              ? t('Pip mode is open')
                              : t('To join this session, close the PiP video window.')
                          }
                        />
                      </>
                    )}
                  </div>
                </>
              )}
              <AEPopup
                id="mapPopup"
                showModal={showDeviceSwitcherPopup}
                headerText={<p className="mb-0">{t('common:Settings')}</p>}
                backdrop="static"
                backdropClassName={'BackColorOpacity'}
                onCloseFunc={() => onCloseDeviceSwitcherPopup()}
                custClassName={'modal-video-call settings-popup'}
              >
                <DeviceSelection joinMeeting={joinMeeting} />
              </AEPopup>
              <LeaveConfirmationPopup
                onLeaveFunc={() => leaveWorkshopBreakoutRoom(true)}
                message={t('WorkshopBreakoutLeaveSuccessfully')}
                alertType={'success'}
                headerText={t('Leave Breakout Room')}
                leaveText={t('Do you really want to leave this session?')}
                onRef={(ref) => setLeaveConfirmationPopup(ref)}
              />
            </>
          ) : (
            <>
              <i className="fa fa-picture-o fa-2x m-r-10" aria-hidden="true" />
              <Error errorMessage={t('Pip mode is open')} />
            </>
          )}
        </div>
      </div>
    </ContentShareProvider>
  );
}
const mapDispatchToProps = {
  storeWarnUserOnPageLeave,
  isPipMode,
  doCheckBreakoutRoomPresent,
  showAlert,
};
const mapStateToProps = (state) => ({
  user: getUserSession(state),
  userRoleDetails: getUserRoleDetails(state),
  pipModeVideo: isPipModeVideoDetail(state),
  eventData: get(state, 'event.data'),
  warnUserOnStateUpdate: get(state, 'host.warnUserOnStateUpdate', false),
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(BreakoutRoom));
