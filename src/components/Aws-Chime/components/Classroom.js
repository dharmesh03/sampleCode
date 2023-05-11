import cx from 'classnames';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import moment from 'moment-timezone';
import { useTranslation } from 'react-i18next';
import AESpinner from '../../../Core/Spinner/Spinner';
import { storeWarnUserOnPageLeave } from '../../../routes/admin/action';
import { isPipMode, showAlert } from '../../../routes/event/action/portalAction';
import {
  getUserRoleDetails,
  isPipMode as isPipModeVideoDetail,
} from '../../../routes/event/action/selectorVirtualEvent';
import {
  getChimeConfigDetails,
  updateChimeConfigDetails,
  doGetBreakoutRooms,
} from '../../../routes/event/portal/Workshop/action';
import { getUserSession } from '../../../routes/login/action/selector';
import { getEventData } from '../../../routes/event/action/selector';
import AEPopup from '../../../Core/Popup';
import AEButton from '../../../Core/Button/Button';
import AELabel from '../../../Core/Label/label';
import WithParams from '../../WrapperComponents/WithParams';
import getChimeContext from '../context/getChimeContext';
import { IsFrom, MessageTopic, Status, ViewMode } from '../enums/MeetingConstant';
import Controls from './Controls';
import DeviceSelection from './NewDeviceSelection';
import Error from './Error';
import LeaveConfirmationPopup from './LeaveConfirmationPopup';
import Roster from './Roster';
import MeetingAlerts from './MeetingAlerts';
import CustomControls from './CustomControls';
import BreakoutItemView from './BreakoutItemView';
import TileLayout from './TileLayout';
import { getQueryParams } from '../../Widget/Utility/jsFunction';
import LiveTranscription from './LiveTranscription';
import { getTimeInLocal } from '../../../routes/event/action/index';
import postSessionCTARedirectToPage from '../../../routes/event/sessions/PostSessionCTARedirect';
import { checkPostSessionCTAIsValid } from '../../../routes/event/sessions/actions/index';
import useAnaylics from '../hooks/useAnaylitics';
import { getLocalStorage, setLocalStorage } from '../../Widget/Utility/Utility';
import { ContentShareProvider, ContentShareErrorType } from '../providers/ContentShareProvider';
import useIsMounted from '../../../hooks/useIsMounted';

let isMeetingLeft = false;
let isPipModeOpen = false;
let chimeConfig = null;
let postSessionCTATimeOut = null;
function Classroom(props) {
  const {
    user,
    session,
    userRoleDetails,
    params,
    pipModeVideo,
    getStatus,
    warnUserOnStateUpdate,
    eventData,
    history,
    userTicketTypeIds,
    pushDataToKinesis,
    tabRescrictionData,
  } = props;
  const { showPipModeVideo, session: pipSession } = pipModeVideo || {};
  const { postSessionCallToActionJson, currentUserRemainingSessionRegistered } = session;
  const { description, destination, buttonLabelText, destinationType, enablePostSessionCallToAction } =
    postSessionCallToActionJson || {};
  const chime = useContext(getChimeContext());
  useAnaylics({ eventData, session, user, userTicketTypeIds, pushDataToKinesis, isFrom: IsFrom.WORKSHOP });
  // const [chimeConfig, setChimeConfig] = useState(null);
  const [viewMode, setViewMode] = useState('Room');
  const [isModeTransitioning] = useState(false);
  const [isContentShareError, setIsContentShareError] = useState(false);
  const [isContentShareEnabled, setIsContentShareEnabled] = useState(false);
  const [showChimeSideBar, setShowChimeSideBar] = useState(false);
  const [showBreakoutSideBar, setShowBreakoutSideBar] = useState(false);
  const [showDeviceSwitcherPopup, setShowDeviceSwitcherPopup] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });
  const [meetingAlerts, setMeetingAlerts] = useState({ message: '' });
  const [leaveConfirmationPopup, setLeaveConfirmationPopup] = useState(false);
  const [showPostSessionCTAPopup, SetShowPostSessionCTAPopup] = useState(false);
  const isMounted = useIsMounted();
  const [showRecordingConfirmationPopup, setShowRecordingConfirmationPopup] = useState(false);

  const audioElement = useRef(null);

  const { t } = useTranslation(['chime', 'common', 'toasterMsg']);

  const isOnWorkshopRoom = () => get(location, 'pathname', '').includes(`/workshops/${session.sessionId}`);

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
          const { params: eventUrl, sessionId } = params || {};
          const { type, attendeeId, chimeConfig: chimeConfigData } = receivedData || {};
          if (attendeeId === chime.attendeeId) return;
          if (type === 'MUTEALL' || (!isModerator && type === 'MUTE-ATTENDEES')) {
            chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
          } else if (type === 'STOPALLVIDEO') {
            chime.audioVideo && (await chime.audioVideo.stopVideoInput());
          } else if (type === 'UPDATE-CONFIG') {
            chimeConfig = chimeConfigData;
          } else if (type === 'UPDATE-BREAKOUT-ROOM') {
            props.doGetBreakoutRooms(eventUrl, sessionId);
          } else if (type === 'ATTENDEEPROFILE') {
            chime.updateAttendeeProfile(receivedData);
          }
        } catch (err) {
          chime.setStreamLog(err.stack);
        }
      }));
  };

  const joinMeeting = async () => {
    const { params: eventUrl, sessionId } = params || {};
    if (!isMounted?.current) {
      await chime.leaveRoom(params.params);
      return;
    }
    props.storeWarnUserOnPageLeave({ stateUpdated: true, showPopupForSaveSetting: false, selectedLink: '' });
    const { muteAttendeesOnEntry, disableAttendeesCameraOnEntry } = chimeConfig || {};
    setShowDeviceSwitcherPopup(false);
    await chime?.audioVideo?.start();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    realtimeSubscribeToReceiveGeneralDataMessage();
    if (chime?.isCamEnabled && (isModerator || !disableAttendeesCameraOnEntry)) {
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
        await chime?.audioVideo?.startLocalVideoTile();
      }
    } else {
      await chime?.joinWithOffCamera();
    }
    await chime?.refreshAudioInputDevice();
    if (!chime?.isMicEnabled || !isModerator || muteAttendeesOnEntry) {
      await chime?.audioVideo?.realtimeMuteLocalAudio();
    }
    if (pipModeVideo) {
      props.isPipMode({ isChimeMeetingPipMode: false, showPipModeVideo: false });
    }
    props.doGetBreakoutRooms(eventUrl, sessionId);
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
    props.history.push(`/e/${params.params}/portal/workshops`);
  };

  const observer = {
    audioVideoDidStop: async (status) => {
      const sessionStatus = await chime.getChimeMeetingStatus(status);
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
        sessionStatus.status === 'RealtimeApiFailed'
      ) {
        if (isMeetingLeft || !isOnWorkshopRoom()) return;
        try {
          setMeetingAlerts({ message: sessionStatus.message, autoHide: false, type: 'error', loading: true });
          await chime.leaveRoom(params.params);
          await chime.createWorkshopRoom(session.sessionId, params.params, IsFrom.WORKSHOP, isModerator);
          setMeetingStatus({ status: 'Succeeded' });
          getStatus('Succeeded');
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
            errorMessage: 'FailedToJoinMeeting',
          });
          getStatus('Failed');
        }
      } else if (sessionStatus.status === 'Left') {
        showMessage(isPipModeOpen ? t('Meeting joining in PIP mode') : t('MeetingEndedSuccessfully'), false);
      } else {
        showMessage(t(sessionStatus.message), true);
      }
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

  const leaveWorkshop = async (withEndSession = true) => {
    isMeetingLeft = true;
    setMeetingStatus({
      status: 'Loading',
      errorMessage: '',
    });
    getStatus('Loading');
    chime.audioVideo && chime.audioVideo.removeObserver(observer);
    if (withEndSession) {
      await chime.leaveRoom(params.params);
    }
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
    props.history.push(`/e/${params.params}/portal/workshops`);
  };

  const initializeMeeting = async () => {
    if (!isMounted?.current) return;
    isPipModeOpen = false;

    if (warnUserOnStateUpdate && warnUserOnStateUpdate.stateUpdated) {
      props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
    }
    try {
      await chime.createWorkshopRoom(
        session.sessionId,
        params.params,
        IsFrom.WORKSHOP,
        isModerator,
        eventData.eventId,
        user.userId,
      );
      setMeetingStatus({ status: 'Succeeded' });
      getStatus('Succeeded');
      chime.audioVideo && chime.audioVideo.addObserver(observer);
      const showPopup = await chime.joinRoom(audioElement);
      const queryParams = getQueryParams();
      if ((queryParams && queryParams.showJoin === 'false') || showPopup) {
        await joinMeeting();
        session?.recordSession && props?.getWorkshopRecordingIndicatorStatus(session?.sessionId);
      } else {
        setShowDeviceSwitcherPopup(true);
      }
    } catch (error) {
      setMeetingStatus({
        status: 'Failed',
        errorMessage: 'FailedToJoinMeeting',
      });
      getStatus('Failed');
    }
  };

  const getBreakOutRoomData = () => {
    const { params: eventUrl } = params || {};
    const { sessionId } = session;
    if (sessionId) {
      props.doGetBreakoutRooms(eventUrl, sessionId);
    }
  };

  useEffect(() => {
    getBreakOutRoomData();
  }, []);

  const getChimeConfigDetails = () => {
    if (params && params.params && session && session.sessionId)
      props
        .getChimeConfigDetails(params.params, session.sessionId)
        .then((resp) => {
          if (resp) {
            chimeConfig = resp;
          }
          initializeMeeting();
        })
        .catch(() => {});
  };

  const updateChimeConfigDetails = (data) => {
    if (params && params.params && session && session.sessionId && data)
      props
        .updateChimeConfigDetails(params.params, session.sessionId, data)
        .then((res) => {
          if (res && !res.errorMessage) {
            chimeConfig = data;
            showMessage(t('SettingUpdatedSuccessfully'));
            chime.sendMessage(MessageTopic.GeneralDataMessage, {
              type: 'UPDATE-CONFIG',
              chimeConfig: data,
            });
          }
        })
        .catch(() => {});
  };

  const checkPostSessionCTAEnable = () => {
    if (enablePostSessionCallToAction) {
      const isExpoOrLounge = destinationType === 'EXHIBITOR' || destinationType === 'LOUNGE';
      if ((isModerator && userRoleDetails?.admin) || currentUserRemainingSessionRegistered || isExpoOrLounge) {
        const { params: eventUrl } = params || {};
        if (description && buttonLabelText && destinationType) {
          if (
            (destinationType === 'EXHIBITOR' && tabRescrictionData?.expoRestricted) ||
            (destinationType === 'LOUNGE' && tabRescrictionData?.loungesRestricted)
          ) {
            return;
          }
          if (destination) {
            props.checkPostSessionCTAIsValid(eventUrl, destination, destinationType).then((resp) => {
              if (resp?.data) {
                SetShowPostSessionCTAPopup(true);
              }
            });
          } else {
            SetShowPostSessionCTAPopup(true);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!showPipModeVideo && session) {
      const { equivalentTimezone } = eventData || {};
      const sessionEndTimeInSeconds = getTimeInLocal(session.endTime, equivalentTimezone || 'US/Eastern').diff(
        moment(),
        'seconds',
      );
      const workshopRecordingAccepted = getLocalStorage('workshopRecordingAccepted');
      if (
        session?.recordSession &&
        (!workshopRecordingAccepted || !workshopRecordingAccepted?.includes(session?.sessionId))
      ) {
        setShowRecordingConfirmationPopup(true);
      } else {
        getChimeConfigDetails();
      }
      if (postSessionCTATimeOut) {
        clearTimeout(postSessionCTATimeOut);
        postSessionCTATimeOut = null;
      }
      if (sessionEndTimeInSeconds > 0) {
        postSessionCTATimeOut = setTimeout(() => {
          checkPostSessionCTAEnable();
        }, sessionEndTimeInSeconds * 1000);
      }
    }
    if (!showPipModeVideo) {
      props.handleRedirectHistory();
    }
    return async () => {
      if (!showPipModeVideo) {
        isMeetingLeft = true;
        if (postSessionCTATimeOut) {
          clearTimeout(postSessionCTATimeOut);
          postSessionCTATimeOut = null;
        }
        await chime.leaveRoom(params.params);
        props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
      }
    };
  }, [showPipModeVideo]);

  useEffect(() => {
    setMeetingAlerts({
      message:
        isContentShareError?.type === ContentShareErrorType.NOT_SUPPORTED
          ? t('BrowserNotSupportScreenShare')
          : isContentShareError?.message,
      type: isContentShareError?.level,
    });
  }, [isContentShareError]);

  const handlePipMode = async () => {
    const isMicMuted = chime.isAttendeeMuted(chime.attendeeId);
    const isCamEnabled = chime.audioVideo.hasStartedLocalVideoTile() || false;
    isPipModeOpen = true;
    setMeetingStatus({
      status: 'Loading',
      errorMessage: '',
    });
    getStatus('Loading');
    // isLeavingForPIPMode = true (switching to PIP mode)
    await chime.leaveRoom(params.params);
    props.isPipMode({
      session,
      isChimeMeetingPipMode: true,
      showPipModeVideo: true,
      isFromPip: IsFrom.WORKSHOP,
      videoCurrentURL: `${window.location.pathname}`,
      isCamEnabled,
      isMicMuted,
    });
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
  };

  const resetMeetingAlert = () => setMeetingAlerts({ message: '' });

  const joinBreakoutRoom = async (roomId) => {
    const { params: eventUrl, sessionId } = params || {};
    isMeetingLeft = true;
    await chime.leaveRoom(eventUrl);
    await new Promise((resolve) => setTimeout(resolve, 200));
    props.history.push(`/e/${eventUrl}/portal/workshops/${sessionId}/breakoutRoom/${roomId}`);
  };

  const breakoutRoomsLength = props?.breakoutRooms && props?.breakoutRooms.length;

  const onContentShareEnabled = (isContentShareEnabled) => {
    setIsContentShareEnabled(isContentShareEnabled);
  };

  const onContentShareError = (isContentShareError) => {
    setIsContentShareError(isContentShareError);
  };

  const acceptRecordingConfirmation = () => {
    const workshopRecordingAccepted = getLocalStorage('workshopRecordingAccepted');
    setLocalStorage(
      'workshopRecordingAccepted',
      workshopRecordingAccepted
        ? !workshopRecordingAccepted.includes(session.sessionId) && [...workshopRecordingAccepted, session?.sessionId]
        : [session?.sessionId],
    );
    setShowRecordingConfirmationPopup(false);
    if (!showPipModeVideo) {
      getChimeConfigDetails();
    }
  };

  const closeRecordingConfirmationPopup = () => {
    props.history.push(`/e/${params.params}/portal/workshops`);
  };
  return (
    <ContentShareProvider>
      <div className={cx('chime workshop', meetingStatus.status === Status.Succeeded && 'm-top')}>
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
              {showPostSessionCTAPopup && (
                <AEPopup
                  id="mapPopup"
                  modalClassName="next-session-popup"
                  showModal
                  isFromAccessPortalPage
                  backdrop={false}
                >
                  <div className={cx('text-align-left', 'm-b-10')}>
                    <AELabel
                      header={description}
                      variant={'body1'}
                      className="justify-content-center"
                      labelClass="post-session-join-popup"
                    />
                  </div>
                  <div className="d-flex justify-content-center pop_btn">
                    <AEButton
                      variant="secondary"
                      className="close_btn"
                      onClick={() => {
                        SetShowPostSessionCTAPopup(!showPostSessionCTAPopup);
                      }}
                    >
                      {t('common:Close')}
                    </AEButton>
                    {buttonLabelText && (
                      <AEButton
                        id="postSessionRedirectBtn"
                        variant="primary"
                        className="join_btn"
                        onClick={() => {
                          postSessionCTARedirectToPage(session, eventData, history);
                        }}
                      >
                        <span>{buttonLabelText}</span>
                      </AEButton>
                    )}
                  </div>
                </AEPopup>
              )}
              {meetingStatus.status === Status.Loading && <AESpinner type="SpinnerSmall" />}
              {meetingStatus.status === Status.Failed && (
                <Error errorMessage={t(meetingStatus.errorMessage)} onLeave={() => leaveWorkshop(false)} />
              )}
              {meetingStatus.status === Status.Succeeded && (
                <>
                  <div className={cx('left', (showChimeSideBar || showBreakoutSideBar) && 'sidebar-toggle')}>
                    <TileLayout isContentShareEnabled={isContentShareEnabled} viewMode={viewMode} />
                    <div id="transcription-div">
                      <LiveTranscription />
                    </div>
                    <div className="controls text-center">
                      <div className="control-bar">
                        <CustomControls
                          viewMode={viewMode}
                          showMessage={showMessage}
                          updateChimeConfigDetails={updateChimeConfigDetails}
                          configData={chimeConfig}
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
                            leaveWorkshop={leaveWorkshop}
                            toggleBreakoutSideBar={() => {
                              setShowChimeSideBar(false);
                              setShowBreakoutSideBar(!showBreakoutSideBar);
                            }}
                            eventId={eventData.eventId || null}
                            userId={user.userId || null}
                            breakoutRoomsLength={breakoutRoomsLength}
                            onContentShareError={onContentShareError}
                            onContentShareEnabled={onContentShareEnabled}
                          />
                        </CustomControls>
                      </div>
                    </div>
                  </div>
                  <div className={cx(showChimeSideBar ? 'right' : 'd-none')}>
                    <div className="roster-box dropdown-bg-remove">
                      <Roster
                        showMessage={showMessage}
                        leaveMeeting={() => leaveWorkshop(false)}
                        toggleSettingsSideBar={() => {
                          setShowChimeSideBar(!showChimeSideBar);
                        }}
                        joinBreakoutRoom={joinBreakoutRoom}
                        eventId={eventData.eventId || null}
                        userId={user.userId || null}
                      />
                    </div>
                  </div>
                  <div className={cx(showBreakoutSideBar ? 'right' : 'd-none')}>
                    {showBreakoutSideBar && (
                      <BreakoutItemView
                        showMessage={showMessage}
                        eventUrl={params && params.params}
                        session={session}
                        toggleBreakoutSideBar={() => {
                          setShowBreakoutSideBar(false);
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <i className="fa fa-picture-o fa-2x m-r-10" aria-hidden="true" />
              <Error
                errorMessage={
                  pipSession?.sessionId === session?.sessionId
                    ? t('Pip mode is open')
                    : t('To join this session, close the PiP video window.')
                }
              />
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
            accessibilityProps={{ tabIndex: '0', 'aria-label': 'Select input and output devices' }}
          >
            <DeviceSelection joinMeeting={joinMeeting} />
          </AEPopup>
          <AEPopup
            id="recordingConfirmationPopup"
            showModal={showRecordingConfirmationPopup}
            headerText={<p className="transcription-modal-header">{t('toasterMsg:This session is being recorded')}</p>}
            isFromAccessPortalPage
            accessibilityProps={{ tabIndex: '0', 'aria-label': 'Session is being recorded confirmation' }}
            modelFooter={
              <div className="m-t-48">
                <AEButton
                  onClick={closeRecordingConfirmationPopup}
                  id="btnPopupLeave"
                  label={t('common:Leave')}
                  variant="secondary"
                />
                <AEButton
                  variant="primary"
                  className="m-l-16"
                  id="btnPopupContinue"
                  onClick={acceptRecordingConfirmation}
                  label={t('common:Continue')}
                />
              </div>
            }
          >
            <div className="leave-confirmation-popup">
              <div>{t('toasterMsg:Do you wish to continue?')}</div>
            </div>
          </AEPopup>
          <LeaveConfirmationPopup
            onLeaveFunc={leaveWorkshop}
            message={t('WorkshopLeaveSuccessfully')}
            alertType={'success'}
            onRef={(ref) => setLeaveConfirmationPopup(ref)}
          />
        </div>
      </div>
    </ContentShareProvider>
  );
}
const mapDispatchToProps = {
  storeWarnUserOnPageLeave,
  isPipMode,
  getChimeConfigDetails,
  updateChimeConfigDetails,
  doGetBreakoutRooms,
  checkPostSessionCTAIsValid,
  showAlert,
};
const mapStateToProps = (state) => ({
  user: getUserSession(state),
  userRoleDetails: getUserRoleDetails(state),
  pipModeVideo: isPipModeVideoDetail(state),
  warnUserOnStateUpdate: state.host && state.host.warnUserOnStateUpdate,
  eventData: getEventData(state),
  breakoutRooms: get(state.virtualEvent, 'workshopBreakoutRooms'),
  tabRescrictionData: get(state, 'virtualEvent.tabRescrictionData'),
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(Classroom));
