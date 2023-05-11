import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import size from 'lodash/size';
import moment from 'moment-timezone';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import Controls from './Controls';
import DeviceSwitcher from './DeviceSwitcher';
import Error from './Error';
import OneToOneRemoteVideo from './OneToOneRemoteVideo';
import LocalVideo from './LocalVideo';
import DeviceSelection from './NewDeviceSelection';
import LeaveConfirmationPopup from './LeaveConfirmationPopup';
import { storeWarnUserOnPageLeave } from '../../../routes/admin/action';
import { getUserSession } from '../../../routes/login/action/selector';
import { ViewMode, Status, IsFrom, MessageTopic } from '../enums/MeetingConstant';
import useAttendees from '../hooks/useAttendees';
import usePrevious from '../../../hooks/usePrevious';
import AESpinner from '../../../Core/Spinner/Spinner';
import AEButton from '../../../Core/Button/Button';
import AETooltip from '../../../Core/Tooltip';
import MeetingAlerts from './MeetingAlerts';
import AEPopup from '../../../Core/Popup';
import { getLocalStorage } from '../../Widget/Utility/Utility';
import { ContentShareProvider } from '../providers/ContentShareProvider';
import { showAlert } from '../../../routes/event/action/portalAction';
import useIsMounted from '../../../hooks/useIsMounted';

function Networkingroom(props) {
  const {
    connectStatus,
    matchData,
    eventUrl,
    loading,
    rejectedBy,
    loggedInUser,
    request,
    changeStatus,
    sessionId,
    showExtendBtn,
    selectedSession,
    eventData,
    user,
  } = props;
  const chime = useContext(getChimeContext());
  const [meetingStatus, setMeetingStatus] = useState({
    status: Status.Loading,
    errorMessage: '',
  });
  const viewMode = ViewMode.Room;
  const [showChimeSideBar, setShowChimeSideBar] = useState(false);
  const [showDeviceSwitcherPopup, setShowDeviceSwitcherPopup] = useState(false);
  const [localvideo, setLocalVideo] = useState(false);
  const [presentAttendees, setPresentAttendees] = useState([]);
  const [leaveConfirmationPopup, setLeaveConfirmationPopup] = useState(false);
  const [toastList, setToastList] = useState([]);
  const audioElement = useRef(null);
  const roster = useAttendees();
  const prevRoster = usePrevious(Object.keys(roster));
  const [watchRoster, setWatchRoster] = useState(false);
  const [isShowExtendBtn, setIsShowExtendBtn] = useState(false);
  const [meetingAlerts, setMeetingAlerts] = useState({ message: '' });
  const isMounted = useIsMounted();
  const { t } = useTranslation(['chime', 'toasterMsg', 'networking', 'common', 'tooltipMsg']);

  const showMessage = (message, isError) => {
    props.showAlert({ message, success: !isError });
  };

  const observer = {
    audioVideoDidStop: async (status) => {
      const sessionStatus = await chime.getChimeMeetingStatus(status);
      if (sessionStatus.status === 'AudioJoinedFromAnotherDevice') {
        setMeetingStatus({
          status: Status.Failed,
          errorMessage: sessionStatus.message,
        });
      } else if (sessionStatus.status === 'Left' || sessionStatus.status === 'AudioCallEnded') {
        if (chime && chime.audioVideo) {
          chime.audioVideo && (await chime.audioVideo.removeObserver(observer));
          await chime.leaveRoom(eventUrl);
        }
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

  const leaveMeetUpSession = async (continueSearch = false) => {
    if (!continueSearch) showMessage(t('toasterMsg:The meet up has ended'), false);
    if (chime && chime.audioVideo) {
      chime.audioVideo && (await chime.audioVideo.removeObserver(observer));
      await chime.leaveRoom(eventUrl);
    }
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
    if (props.onCancelClick) props.onCancelClick(continueSearch);
  };

  const onConfirmation = (type, data) => {
    const tempToastList = [...toastList];
    const toastListItem = data && tempToastList.findIndex((e) => e.id === data.id);
    tempToastList.splice(toastListItem, 1);
    setToastList(tempToastList);
    if (type && type !== 'DELETE') {
      chime.sendMessage(MessageTopic.GeneralDataMessage, {
        type,
      });
      type === 'EXTEND_RESPONSE' && props.onExtendAction();
    }
    if (type && type === 'EXTEND_REQUEST_DENIED') {
      setIsShowExtendBtn(true);
    } else if (type === 'EXTEND_RESPONSE') {
      setIsShowExtendBtn(false);
    }
  };

  const realtimeSubscribeToReceiveGeneralDataMessage = async () => {
    chime.audioVideo &&
      (await chime.audioVideo.realtimeSubscribeToReceiveDataMessage(MessageTopic.GeneralDataMessage, (data) => {
        try {
          const receivedData = (data && data.json()) || {};
          const { attendeeId, name, type } = receivedData || {};
          const toasterArray = [];
          if (type === 'EXTEND_REQUEST') {
            const tosterData = Object.create({
              id: attendeeId,
              message: t('networking:WantToExtendMeeting', { name }),
              type: 'EXTEND_RESPONSE',
              btnText: 'Accept',
            });
            toasterArray.push(tosterData);
            setToastList(toasterArray);
          } else if (type === 'EXTEND_REQUEST_DENIED') {
            showMessage(t('networking:ExtendMeetingRequestDenied'), true);
            setToastList(toasterArray);
            setIsShowExtendBtn(true);
          } else if (type === 'EXTEND_RESPONSE') {
            props.onExtendAction();
          } else if (type === 'ATTENDEEPROFILE') {
            chime.updateAttendeeProfile(receivedData);
          }
        } catch (err) {
          chime.setStreamLog(err.stack);
        }
      }));
  };

  const joinNetworkingSession = async () => {
    if (!isMounted?.current) {
      await chime.leaveRoom(eventUrl);
      return;
    }
    props.storeWarnUserOnPageLeave({ stateUpdated: true, showPopupForSaveSetting: false, selectedLink: '' });
    setShowDeviceSwitcherPopup(false);
    chime.audioVideo && (await chime.audioVideo.start());
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (chime?.isCamEnabled) {
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
      await chime.joinWithOffCamera();
    }
    if (!chime?.isMicEnabled) {
      await chime?.audioVideo?.realtimeMuteLocalAudio();
    }
    await chime.refreshAudioInputDevice();
    setTimeout(() => {
      chime.sendMessage(MessageTopic.GeneralDataMessage, {
        type: 'ATTENDEEPROFILE',
        profilePic: user?.userProfilePhoto,
        firstName: user?.firstName,
        lastName: user?.lastName,
      });
    }, 2000);
  };

  const initializeMeeting = async (attendee, meeting) => {
    if (!isMounted?.current) return;
    const { warnUserOnStateUpdate } = props;
    if (warnUserOnStateUpdate && warnUserOnStateUpdate.stateUpdated) {
      props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
    }
    try {
      await chime.createNetworkingMeetingRoom(attendee, meeting, IsFrom.NETWORKING, sessionId, user);
      setMeetingStatus({
        status: Status.Succeeded,
      });

      const showPopup = await chime.joinRoom(audioElement);
      if (chime.iOS() || showPopup) {
        joinNetworkingSession();
      } else {
        setShowDeviceSwitcherPopup(true);
      }
      setTimeout(() => setWatchRoster(true), 20000);
      chime.audioVideo && (await chime.audioVideo.addObserver(observer));
      const callback = async (presentAttendeeId, present) => {
        if (presentAttendeeId.indexOf('#content') === -1) {
          const index = presentAttendees && presentAttendees.indexOf(presentAttendeeId);
          if (present && index < 0) {
            presentAttendees.push(presentAttendeeId);
            setPresentAttendees(presentAttendees);
          } else if (!present && index > -1) {
            setPresentAttendees([]);
            chime.audioVideo && (await chime.audioVideo.stop());
          }
        }
      };
      chime.audioVideo && (await chime.audioVideo.realtimeSubscribeToAttendeeIdPresence(callback));
      realtimeSubscribeToReceiveGeneralDataMessage();
    } catch (error) {
      console.error(error);
      setMeetingStatus({
        status: Status.Failed,
        errorMessage: error.message,
      });
    }
  };

  useEffect(() => {
    if (eventUrl && matchData && matchData.meeting && matchData.meeting !== 'undefined' && matchData.attendee) {
      initializeMeeting(matchData.attendee, matchData.meeting);
    }
    return async () => {
      await chime.leaveRoom(eventUrl);
      props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
    };
  }, []);

  useEffect(() => {
    if (!roster || !prevRoster) return;
    const currentRoster = Object.keys(roster);
    const previousRoster = Object.keys(prevRoster);
    if (currentRoster.length === 1 && previousRoster.length === 2) {
      leaveMeetUpSession();
    }
  }, [roster, prevRoster]);

  useEffect(() => {
    setIsShowExtendBtn(showExtendBtn);
  }, [showExtendBtn]);

  useEffect(() => {
    if (watchRoster) {
      if (Object.keys(chime.roster).length && Object.keys(chime.roster).length < 2) {
        leaveMeetUpSession(true);
      }
    }
  }, [watchRoster]);

  const getConnectTextByStatus = (request) => {
    switch (connectStatus) {
      case 'REQUESTED':
        return request ? 'Requested' : 'Accept';
      case 'ACCEPT':
        return 'Connected';
      case 'REJECT':
        return parseInt(rejectedBy, 10) === parseInt(loggedInUser.userId, 10) ? 'Reconnect' : 'Rejected';
      default:
        return 'Connect';
    }
  };

  const extendMeeting = () => {
    const { endTime } = selectedSession || {};
    const { meetingTimeOut } = props;
    const equivalentTimezone = (eventData && eventData.equivalentTimezone) || 'US/Eastern';
    const sessionEndTime = moment.tz(moment(endTime).format('YYYY-MM-DD HH:mm:ss'), equivalentTimezone).local();
    const currentTime = moment.tz(moment().format('YYYY-MM-DD HH:mm:ss'), equivalentTimezone).local();
    const extendendTime = sessionEndTime.diff(currentTime, 'seconds');
    if (meetingTimeOut <= extendendTime) {
      chime.sendMessage(MessageTopic.GeneralDataMessage, {
        type: 'EXTEND_REQUEST',
      });
      showMessage(t('networking:SentRequestSuccessfully'), false);
      setIsShowExtendBtn(false);
    } else {
      showMessage(t('audience:Its not possible to extend the meeting because the session has ended'), true);
      setIsShowExtendBtn(false);
    }
  };

  const renderToster = () => (
    <>
      {size(toastList) > 0 ? (
        <div
          className={cx('neworking-toster confirm-notification-container')}
          role="region"
          aria-label="dialog"
          /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
          tabIndex="0"
        >
          {toastList.map((toast, i) => (
            <div
              key={i}
              className="notification toast m-auto"
              style={{ backgroundColor: toast.backgroundColor || '#406ae8' }}
            >
              <AETooltip
                tooltip={t('tooltipMsg:DeniedExtendRequestToolTip')}
                id="tooltip-11"
                overlayProps={{ placement: 'left' }}
              >
                <i className="close-btn cursor fa fa-close" onClick={() => onConfirmation('DELETE', toast)} />
              </AETooltip>
              <div className="d-inline-flex">
                <p className="notification-title">{toast.message || ''}</p>
              </div>
              <div className="d-inline-flex btn-toster-mobile">
                <AEButton
                  variant="success"
                  className="m-r-10"
                  onClick={() => {
                    onConfirmation(toast.type, toast);
                  }}
                  size="small"
                  aria-label={`${toast.message || ''}. ${toast.btnText || 'Admit'}`}
                >
                  {t(`common:${toast.btnText || 'Admit'}`)}
                </AEButton>
                <AEButton
                  variant="danger"
                  onClick={() => {
                    onConfirmation('EXTEND_REQUEST_DENIED', toast);
                  }}
                  size="small"
                  aria-label="Reject extend request"
                >
                  {t('common:Reject')}
                </AEButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        ''
      )}
    </>
  );

  return (
    <ContentShareProvider>
      <div className="networking-room">
        <h1 className="sr-only">{t('networking:Networking')}</h1>
        <div className="content-wrapper-front">
          <audio ref={audioElement} className="d-none" />
          <div className="chime local-video-box" id="chime-meeting-wrapper">
            <MeetingAlerts {...meetingAlerts} />
            <div
              className={cx('classroom', {
                roomMode: viewMode === 'Room',
                screenShareMode: viewMode === 'ScreenShare',
              })}
            >
              {meetingStatus.status === Status.Loading && <AESpinner type="SpinnerSmall" />}
              {meetingStatus.status === Status.Failed && (
                <Error errorMessage={t(meetingStatus.errorMessage)} onLeave={() => leaveMeetUpSession()} />
              )}
              {meetingStatus.status === Status.Succeeded && (
                <>
                  <div className={cx('left', showChimeSideBar && 'sidebar-toggle')}>
                    <div className="remoteVideoGroupWrapper">
                      {size(toastList) === 0 && isShowExtendBtn && (
                        <AEButton
                          variant="primary"
                          className="extend-conversation-btn btn btn-md btn-prime"
                          onClick={() => {
                            extendMeeting();
                          }}
                        >
                          {t('networking:ExtendMeeting')}
                        </AEButton>
                      )}
                      <OneToOneRemoteVideo viewMode={viewMode} />
                    </div>

                    <div className="fixed-controls mobile-fixed-control">
                      <div className=" text-center">
                        {chime && chime.audioVideo && (
                          <div className="end-connect-button-container">
                            {renderToster()}
                            <div className="mobile-end-connect">
                              <div className="m-b-10">
                                {connectStatus !== 'ACCEPT' && (
                                  <AEButton
                                    className="m-r-10"
                                    loading={loading}
                                    disabled={
                                      loading ||
                                      !changeStatus ||
                                      getConnectTextByStatus(request) === 'Rejected' ||
                                      getConnectTextByStatus(request) === 'Requested'
                                    }
                                    onClick={
                                      getConnectTextByStatus(request) === 'Accept'
                                        ? () => props.acceptRequestByUser(matchData.matchingUserId)
                                        : () => props.connectWithUser(matchData.matchingUserId, true)
                                    }
                                    isPrevIcon
                                    icon="virtual-icon-connect"
                                    id={`${getConnectTextByStatus(request)}`}
                                    label={
                                      changeStatus
                                        ? t(`common:${getConnectTextByStatus(request)}`)
                                        : t('common:Loading')
                                    }
                                  />
                                )}
                              </div>
                              <div className="controls text-center">
                                <Controls
                                  viewMode={viewMode}
                                  onClickShareButton={() => {}}
                                  toggleSettingsSideBar={() => {
                                    setShowChimeSideBar(!showChimeSideBar);
                                  }}
                                  leaveNetworking={leaveMeetUpSession}
                                  videoEnbled={localvideo}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="custom-video  p-l-r-0" onContextMenu={(e) => e.preventDefault()}>
                      <LocalVideo
                        onLocalVideoStatus={(status) => {
                          setLocalVideo(status);
                        }}
                      />
                    </div>
                  </div>
                  <div className={cx(showChimeSideBar ? 'right' : 'd-none')}>
                    <div className="deviceSwitcher">
                      <DeviceSwitcher
                        toggleSettingsSideBar={() => {
                          setShowChimeSideBar(!showChimeSideBar);
                        }}
                        showChimeSideBar={showChimeSideBar}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <LeaveConfirmationPopup
          onLeaveFunc={leaveMeetUpSession}
          message={t('toasterMsg:The meet up has ended')}
          alertType={'success'}
          onRef={(ref) => setLeaveConfirmationPopup(ref)}
        />
        <AEPopup
          id="mapPopup"
          showModal={showDeviceSwitcherPopup}
          headerText={<p className="mb-0">{t('common:Settings')}</p>}
          backdrop="static"
          backdropClassName={'BackColorOpacity'}
          custClassName={'modal-video-call settings-popup'}
          onCloseFunc={() => leaveMeetUpSession()}
        >
          <DeviceSelection joinMeeting={joinNetworkingSession} />
        </AEPopup>
      </div>
    </ContentShareProvider>
  );
}

const mapDispatchToProps = {
  storeWarnUserOnPageLeave,
  showAlert,
};
const mapStateToProps = (state) => ({
  loggedInUser: get(state, 'session.user'),
  user: getUserSession(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(Networkingroom);
