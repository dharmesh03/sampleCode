import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import moment from 'moment';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { doGetEventData, getTimeInLocal } from '../../../routes/event/action';
import { joinStreaming, getEventExhibitor } from '../../../routes/exhibitorPortal/action/index';
import { getEventData } from '../../../routes/event/action/selector';
import getChimeContext from '../context/getChimeContext';
import Controls from './Controls';
import Roster from './Roster';
import TvOption from '../../Widget/TvOption';
import Alerts from '../../Widget/Alerts';
import DeviceSelection from './NewDeviceSelection';
import {
  getUserRoleDetails,
  isPipMode as isPipModeVideoDetail,
} from '../../../routes/event/action/selectorVirtualEvent';
import { getIsExhibitorStaffByExpoId, isPipMode, showAlert } from '../../../routes/event/action/portalAction';
import Toast from '../../Widget/Toast';
import { getUserSession } from '../../../routes/login/action/selector';
import Error from './Error';
import CustomControls from './CustomControls';
import { ViewMode, Status, IsFrom, MessageTopic } from '../enums/MeetingConstant';
import WithParams from '../../WrapperComponents/WithParams';
import AEButton from '../../../Core/Button/Button';
import AELabel from '../../../Core/Label/label';
import AESpinner from '../../../Core/Spinner/Spinner';
import MeetingAlerts from './MeetingAlerts';
import TileLayout from './TileLayout';
import { JOIN_EXPO_MEETING } from '../../../routes/exhibitorPortal/action/userActivityEventConstant';
import useLocalVideoTile from '../hooks/useLocalVideoTile';
import AEPopup from '../../../Core/Popup';
import { getLocalStorage } from '../../Widget/Utility/Utility';
import { ContentShareProvider, ContentShareErrorType } from '../providers/ContentShareProvider';
import useIsMounted from '../../../hooks/useIsMounted';

let needToredirect = true;
let isMeetingLeft = false;
function Exhibitorroom(props) {
  const { params, exhibitorId, userRoleDetails, isExhibitoreStudio, eventData, exhibitor, pipModeVideo, user } =
    props || {};
  const { roles } = userRoleDetails || [];
  const { showPipModeVideo } = pipModeVideo || {};
  const chime = useContext(getChimeContext());
  const { isVideoEnabled } = useLocalVideoTile();
  const [viewMode, setViewMode] = useState(ViewMode.Room);
  const [isModeTransitioning] = useState(false);
  const [isContentShareError, setIsContentShareError] = useState(false);
  const [isContentShareEnabled, setIsContentShareEnabled] = useState(false);
  const [showChimeSideBar, setShowChimeSideBar] = useState(false);
  const [showDeviceSwitcherPopup, setShowDeviceSwitcherPopup] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });
  const [isFrom, setIsFrom] = useState(isExhibitoreStudio ? IsFrom.EXHIBITOR_STUDIO : IsFrom.EXHIBITOR_PORTAL);
  const audioElement = useRef(null);
  const [toastList, setToastList] = useState([]);
  const [realTimeRequestAttendees, setRealTimeRequestAttendees] = useState(new Set());
  const [isExhibitorStaff, setIsExhibitorStaff] = useState(false);
  const [isRaisedRequest, setIsRaisedRequest] = useState(false);
  const isModerator = (userRoleDetails && (userRoleDetails.admin || userRoleDetails.staff)) || isExhibitorStaff;
  const { requireApprovalBeforeAttendeesCanJoin } = exhibitor;
  const [meetingAlerts, setMeetingAlerts] = useState({ message: '' });
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [confirmationPopup, setConfirmationPopup] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const isMounted = useIsMounted();
  const { t } = useTranslation(['chime', 'common']);

  const showMessage = (message, isError) => {
    props.showAlert({ message, success: !isError });
    setMessage(message);
    setIsError(isError);
    setLoading(false);
    setTimeout(() => {
      setMessage('');
    }, 4000);
  };

  const isOnExpoPage = () =>
    isFrom === IsFrom.EXHIBITOR_STUDIO
      ? get(location, 'pathname', '').includes(`/exhibitor-studio/${exhibitorId}`)
      : get(location, 'pathname', '').includes(`/expo/${exhibitorId}`);

  const realtimeSubscribeToReceiveGeneralDataMessage = async (moderator) => {
    const attendeeRequestSet = new Set();
    chime.audioVideo &&
      (await chime.audioVideo.realtimeSubscribeToReceiveDataMessage(MessageTopic.GeneralDataMessage, async (data) => {
        try {
          const receivedData = (data && data.json()) || {};
          const { type, attendeeId, name } = receivedData || {};

          if (moderator && (type === 'DISMISS-REQUEST' || type === 'RAISE-REQUEST')) {
            const toastListItem = toastList.findIndex((e) => e.id === attendeeId);
            if (toastListItem === -1 && type === 'RAISE-REQUEST') {
              attendeeRequestSet.add(attendeeId);
              toastList.push({
                id: attendeeId,
                message: t('{{name}} want to join stream!', { name: name || 'Guest' }),
              });
            } else if (type === 'DISMISS-REQUEST') {
              attendeeRequestSet.delete(attendeeId);
              if (toastListItem > -1) toastList.splice(toastListItem, 1);
            }
            setToastList(toastList);
            setRealTimeRequestAttendees(new Set(attendeeRequestSet));
          } else if (attendeeId !== chime.attendeeId && type === 'MUTEALL') {
            chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
          } else if (attendeeId !== chime.attendeeId && type === 'STOPALLVIDEO') {
            chime.audioVideo && (await chime.audioVideo.stopVideoInput());
          }
        } catch (err) {
          chime.setStreamLog(err.stack);
        }
      }));
  };

  const joinMeeting = async (moderator) => {
    if (!isMounted?.current) {
      await chime.leaveRoom(params.params);
      return;
    }
    setMeetingJoined(true);
    setShowDeviceSwitcherPopup(false);
    chime.audioVideo && (await chime.audioVideo.start());
    await new Promise((resolve) => setTimeout(resolve, 2500));
    realtimeSubscribeToReceiveGeneralDataMessage(moderator);
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
      await chime?.joinWithOffCamera();
    }
    await chime.refreshAudioInputDevice();
    setIsFrom(IsFrom.EXHIBITOR_STUDIO);
    if (chime?.isMicEnabled && isModerator) {
      await chime?.audioVideo?.realtimeUnmuteLocalAudio();
    }
    props && props.trackUserExpoVisitData && props.trackUserExpoVisitData({ joinMeeting: ['ACCELEVENTS'] });
    props &&
      props.trackUserExpoVisitData &&
      props.handlePushDataToDynamoDB(JOIN_EXPO_MEETING, { meeting: 'ACCELEVENTS', link: window.location.href });
  };

  const onCloseDeviceSwitcherPopup = async () => {
    setShowDeviceSwitcherPopup(false);
    await chime.leaveRoom(params.params);
    props.history.push(`/e/${params && params.params}/portal/expo`);
  };

  const onLeaveExhibitorStudio = async (withEndSession = true) => {
    isMeetingLeft = true;
    if (chime && withEndSession) {
      await chime.leaveRoom(params.params);
    }
    if (needToredirect) {
      if (
        (roles?.indexOf('exhibitoradmin') > -1 || roles?.indexOf('leadretriever') > -1) &&
        window?.location?.pathname?.indexOf('/portal/exhibitor-studio/') > -1
      ) {
        props.history.push(`/e/${params && params.params}/portal/mybooth`);
      } else {
        props.history.push(`/e/${params && params.params}/portal/expo`);
      }
    }
  };

  const observer = {
    audioVideoDidStop: async (status) => {
      const sessionStatus = await chime.getChimeMeetingStatus(status);
      if (sessionStatus.status === 'AudioJoinedFromAnotherDevice') {
        setMeetingStatus({
          status: 'Failed',
          errorMessage: sessionStatus.message,
        });
      } else if (
        sessionStatus.status === 'TaskFailed' ||
        sessionStatus.status === 'SignalingBadRequest' ||
        sessionStatus.status === 'TURNCredentialsForbidden' ||
        sessionStatus.status === 'RealtimeApiFailed'
      ) {
        if (isMeetingLeft || !isOnExpoPage()) return;
        try {
          setMeetingAlerts({ message: sessionStatus.message, autoHide: false, type: 'error', loading: true });
          await chime.leaveRoom(params.params);
          await chime.createExhibitorRoom(
            exhibitorId,
            params.params,
            exhibitor && isModerator && exhibitor.meetingEntryExitNotificationOn,
            isModerator,
          );
          setMeetingStatus({ status: 'Succeeded' });
          chime.audioVideo && chime.audioVideo.addObserver(observer);
          await chime.joinRoom(audioElement, true);
          chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
          if (isFrom === IsFrom.EXHIBITOR_STUDIO) {
            if (!showDeviceSwitcherPopup) {
              await joinMeeting(isModerator);
            }
          } else {
            chime.audioVideo && (await chime.audioVideo.start());
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
        }
      } else if (sessionStatus.status === 'Left') {
        await onLeaveExhibitorStudio();
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
      setMeetingJoined((meetingJoined) => {
        if (meetingJoined) {
          setMeetingAlerts({
            message: 'SlowNetWorkRecommendToTurnOffVideo',
            autoHide: true,
            type: 'warning',
          });
        }
        return meetingJoined;
      });
    },
  };

  const initializeMeeting = async (moderator) => {
    if (!isMounted?.current) return;
    const equivalentTimezone = (eventData && eventData.equivalentTimezone) || 'US/Eastern';
    if (eventData && getTimeInLocal(eventData.endDate, equivalentTimezone).diff(moment(), 'minute') <= 0) {
      setMeetingStatus({
        status: 'Failed',
        errorMessage: 'Event Ended',
      });
      return;
    }
    try {
      await chime.createExhibitorRoom(
        exhibitorId,
        params.params,
        exhibitor && moderator && exhibitor.meetingEntryExitNotificationOn,
        moderator,
      );
      setMeetingStatus({
        status: 'Succeeded',
      });
      if (!isOnExpoPage()) {
        return;
      }
      chime.audioVideo && (await chime.audioVideo.addObserver(observer));
      const showPopup = await chime.joinRoom(audioElement);
      chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
      if (isFrom === IsFrom.EXHIBITOR_STUDIO) {
        if (!showPopup) {
          setShowDeviceSwitcherPopup(true);
        } else {
          joinMeeting(moderator);
        }
      } else {
        chime.audioVideo && (await chime.audioVideo.start());
        await chime?.joinWithOffCamera();
      }
    } catch (error) {
      setMeetingStatus({
        status: 'Failed',
        errorMessage: error.message,
      });
    }
  };

  const getIsExhibitorStaffByExpoId = () => {
    props.getIsExhibitorStaffByExpoId(params.params, exhibitorId).then((resp) => {
      setIsExhibitorStaff(resp);
      const isExhibitor = userRoleDetails && !(userRoleDetails.admin || userRoleDetails.staff) && resp;
      if (isFrom === IsFrom.EXHIBITOR_PORTAL && isExhibitor) {
        setMeetingStatus({
          status: 'Failed',
          errorMessage: 'UseMyBoothPageToAccessLiveStreamAsExhibitor',
        });
      } else if (isOnExpoPage()) {
        initializeMeeting((userRoleDetails && (userRoleDetails.admin || userRoleDetails.staff)) || resp);
      }
    });
  };

  const closePopup = () => {
    setConfirmationMessage('');
    setConfirmationPopup(false);
  };

  const allowToJoin = async () => {
    await chime.leaveRoom(params.params);
    await props.isPipMode({ isChimeMeetingPipMode: false, showPipModeVideo: false });
    closePopup();
  };

  useEffect(() => {
    if (!showPipModeVideo && exhibitorId) {
      needToredirect = true;
      getIsExhibitorStaffByExpoId();
    } else {
      setConfirmationMessage(t('chime:Joining this session will close your Picture in Picture window.'));
      setConfirmationPopup(true);
    }
    return async () => {
      if (!showPipModeVideo) {
        needToredirect = false;
        isMeetingLeft = true;
        await chime.leaveRoom(params.params);
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

  const onConfirmation = (type, data) => {
    const toastListItem = data && toastList.findIndex((e) => e.id === data.id);
    toastList.splice(toastListItem, 1);
    setToastList(...toastList);
    if (type && type !== 'DELETE') {
      chime.sendMessage(data.id, {
        type,
      });
    }
  };

  const joinExhibitorStudio = async () => {
    const showPopup = await chime.joinRoom(audioElement);
    if (!showPopup) {
      setShowDeviceSwitcherPopup(true);
    } else {
      joinMeeting(isModerator);
    }
  };

  const attendeeAction = async (type) => {
    chime.sendMessage(MessageTopic.GeneralDataMessage, {
      type: 'DISMISS-REQUEST',
    });
    type !== 'ADMIT' && setIsRaisedRequest(false);
    if (type === 'ADMIT') {
      joinExhibitorStudio();
    }
  };

  const resetMeetingAlert = () => setMeetingAlerts({ message: '' });

  const onContentShareEnabled = (isContentShareEnabled) => {
    setIsContentShareEnabled(isContentShareEnabled);
  };

  const onContentShareError = (isContentShareError) => {
    setIsContentShareError(isContentShareError);
  };

  return (
    <ContentShareProvider>
      <div className="exhibitor-room video-custom">
        {isExhibitoreStudio && <Alerts message={message} loading={loading} isError={isError} />}
        {toastList && <Toast toastList={toastList} onConfirmation={onConfirmation} />}
        <audio ref={audioElement} className="d-none" />
        {!isVideoEnabled && !isExhibitoreStudio && (
          <>
            <AELabel
              variant={'body2'}
              color={'#31708f'}
              header={t('Your camera is turned off')}
              className="justify-content-center alert-info alert width-100-per"
              labelClass={'m-b-0'}
            />
          </>
        )}
        <div className={cx('chime', !isExhibitoreStudio && 'view-mode-container ')}>
          <MeetingAlerts {...meetingAlerts} onClose={resetMeetingAlert} />
          <div
            id="exhibitor-studio"
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
                  <Error errorMessage={t(meetingStatus.errorMessage)} onLeave={() => onLeaveExhibitorStudio(false)} />
                )}
                {meetingStatus.status === Status.Succeeded && (
                  <>
                    <div className={cx('left', showChimeSideBar && 'sidebar-toggle')}>
                      <TileLayout
                        isContentShareEnabled={isContentShareEnabled}
                        viewMode={viewMode}
                        isFrom={IsFrom.EXHIBITOR_STUDIO}
                        hasJoinedExpo={meetingJoined}
                      />
                      {isFrom === IsFrom.EXHIBITOR_PORTAL && !loading && (
                        <div className="join-btn-box">
                          {isModerator || !requireApprovalBeforeAttendeesCanJoin ? (
                            <AEButton
                              className="expo-portal-join"
                              onClick={() => {
                                joinExhibitorStudio();
                              }}
                              label={t('common:Join')}
                            />
                          ) : (
                            <AEButton
                              onClick={() => {
                                setIsRaisedRequest(!isRaisedRequest);
                                chime.sendMessage(MessageTopic.GeneralDataMessage, {
                                  type: isRaisedRequest ? 'DISMISS-REQUEST' : 'RAISE-REQUEST',
                                });
                              }}
                              label={t(isRaisedRequest ? 'Waiting on moderator approval' : 'Ask to join')}
                            />
                          )}
                        </div>
                      )}
                      <div className={cx(isFrom === IsFrom.EXHIBITOR_PORTAL && 'd-none')}>
                        <div className="controls text-center">
                          <div className="control-bar">
                            <CustomControls
                              viewMode={viewMode}
                              onLayoutChange={() =>
                                setViewMode(viewMode === ViewMode.Room ? ViewMode.Featured : ViewMode.Room)
                              }
                              eventId={eventData.eventId || null}
                              userId={user.userId || null}
                            >
                              <Controls
                                viewMode={viewMode}
                                toggleSettingsSideBar={() => {
                                  setShowChimeSideBar(!showChimeSideBar);
                                }}
                                onLeaveExhibitorStudio={onLeaveExhibitorStudio}
                                showMessage={showMessage}
                                eventId={eventData.eventId || null}
                                userId={user.userId || null}
                                onContentShareError={onContentShareError}
                                onContentShareEnabled={onContentShareEnabled}
                              />
                            </CustomControls>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={cx(showChimeSideBar ? 'right' : 'd-none')}>
                      <div className="roster-box">
                        <Roster
                          showMessage={showMessage}
                          attendeeAction={attendeeAction}
                          realTimeRequestAttendees={realTimeRequestAttendees}
                          leaveMeeting={onLeaveExhibitorStudio}
                          toggleSettingsSideBar={() => {
                            setShowChimeSideBar(!showChimeSideBar);
                          }}
                          eventId={eventData.eventId || null}
                          userId={user.userId || null}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <i className="fa fa-picture-o fa-2x m-r-10" aria-hidden="true" />
                <Error errorMessage={t('To join this session, close the PiP video window.')} />
              </>
            )}
          </div>
          {isFrom === 'EXHIBITOR-STUDIO' && !isExhibitoreStudio && (
            <div className="player">
              <div className="fullscreen">
                <TvOption fullscreenThis={'exhibitor-studio'} viewsPage />
              </div>
            </div>
          )}
        </div>
        <AEPopup
          id="mapPopup"
          showModal={showDeviceSwitcherPopup}
          headerText={t('common:Settings')}
          headerClass="m-b-30"
          backdrop="static"
          backdropClassName={'BackColorOpacity'}
          onCloseFunc={() => onCloseDeviceSwitcherPopup()}
          custClassName={'modal-video-call settings-popup'}
        >
          <DeviceSelection joinMeeting={() => joinMeeting(isModerator)} />
        </AEPopup>
        <AEPopup
          onCloseFunc={() => closePopup()}
          id="confirmationPopup"
          showModal={confirmationPopup}
          headerText={t('common:Confirm')}
          headerClass="m-b-30"
          modelFooter={
            <div>
              <AEButton
                className="m-r-5"
                onClick={() => {
                  allowToJoin();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    allowToJoin();
                  }
                }}
                aria-label={`${confirmationMessage}`}
              >
                {t('common:Join Anyway')}
              </AEButton>
              <AEButton
                variant="danger"
                onClick={() => {
                  closePopup();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    closePopup();
                  }
                }}
                aria-label={`${confirmationMessage}`}
              >
                {t('common:Cancel')}
              </AEButton>
            </div>
          }
        >
          <div className="center-align">
            <p className="text-center">{confirmationMessage}</p>
          </div>
        </AEPopup>
      </div>
    </ContentShareProvider>
  );
}
const mapDispatchToProps = {
  joinStreaming,
  doGetEventData,
  getIsExhibitorStaffByExpoId,
  getEventExhibitor,
  isPipMode,
  showAlert,
};
const mapStateToProps = (state) => ({
  exhibitor: get(state, 'exhibitor.exhibitor'),
  eventData: getEventData(state),
  userRoleDetails: getUserRoleDetails(state),
  pipModeVideo: isPipModeVideoDetail(state),
  user: getUserSession(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(Exhibitorroom));
