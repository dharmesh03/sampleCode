import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import Controls from './Controls';
import Roster from './Roster';
import DeviceSelection from './NewDeviceSelection';
import Error from './Error';
import AESpinner from '../../../Core/Spinner/Spinner';
import {
  getUserRoleDetails,
  isPipMode as isPipModeVideoDetail,
} from '../../../routes/event/action/selectorVirtualEvent';
import LeaveConfirmationPopup from './LeaveConfirmationPopup';
import { storeWarnUserOnPageLeave } from '../../../routes/admin/action';
import { getUserSession } from '../../../routes/login/action/selector';
import { getEventData } from '../../../routes/event/action/selector';
import { getQueryParams } from '../../Widget/Utility/jsFunction';
import { ViewMode, Status, IsFrom, MessageTopic } from '../enums/MeetingConstant';
import { isPipMode, showAlert } from '../../../routes/event/action/portalAction';
import MeetingAlerts from './MeetingAlerts';
import CustomControls from './CustomControls';
import TileLayout from './TileLayout';
import ChimeHeader from './ChimeHeader';
import AEPopup from '../../../Core/Popup';
import { getLocalStorage } from '../../Widget/Utility/Utility';
import { ContentShareProvider, ContentShareErrorType } from '../providers/ContentShareProvider';
import useIsMounted from '../../../hooks/useIsMounted';

let needToredirect = true;
let isMeetingLeft = false;
let isPipModeOpen = false;
function LiveForumroom(props) {
  const { userRoleDetails, loungeData, eventData, pipModeVideo, user } = props;
  const { showPipModeVideo, loungeData: pipLoungeData } = pipModeVideo || {};
  const { eventURL } = eventData || {};
  const chime = useContext(getChimeContext());
  const [viewMode, setViewMode] = useState(ViewMode.Room);
  const [isModeTransitioning] = useState(false);
  const [isContentShareError, setIsContentShareError] = useState(false);
  const [isContentShareEnabled, setIsContentShareEnabled] = useState(false);
  const [showChimeSideBar, setShowChimeSideBar] = useState(false);
  const [showDeviceSwitcherPopup, setShowDeviceSwitcherPopup] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });
  const [meetingAlerts, setMeetingAlerts] = useState({ message: '' });
  const audioElement = useRef(null);
  const [leaveConfirmationPopup, setLeaveConfirmationPopup] = useState(false);
  const isModerator = userRoleDetails && (userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.speaker);
  const isMounted = useIsMounted();
  const { t } = useTranslation(['chime', 'common']);

  const showMessage = (message, isError) => {
    props.showAlert({ message, success: !isError });
  };

  const realtimeSubscribeToReceiveGeneralDataMessage = async () => {
    chime.audioVideo &&
      (await chime.audioVideo.realtimeSubscribeToReceiveDataMessage(MessageTopic.GeneralDataMessage, async (data) => {
        try {
          const receivedData = (data && data.json()) || {};
          const { type, attendeeId } = receivedData || {};
          if (attendeeId !== chime.attendeeId && type === 'MUTEALL') {
            chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
          } else if (attendeeId !== chime.attendeeId && type === 'STOPALLVIDEO') {
            chime.audioVideo && (await chime.audioVideo.stopVideoInput());
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
      await chime.leaveRoom(eventURL);
      return;
    }
    setShowDeviceSwitcherPopup(false);
    chime.audioVideo && (await chime.audioVideo.start());
    await new Promise((resolve) => setTimeout(resolve, 2500));
    realtimeSubscribeToReceiveGeneralDataMessage();
    if (chime?.isCamEnabled) {
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
    if (!isModerator || !chime?.isMicEnabled) {
      await chime?.audioVideo?.realtimeMuteLocalAudio();
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
    await chime.leaveRoom(eventURL);
    props.setActiveTab();
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
        if (isMeetingLeft || !get(location, 'pathname', '').includes(`/lounge/${loungeData.id}`)) return;
        try {
          setMeetingAlerts({ message: sessionStatus.message, autoHide: false, type: 'error', loading: true });
          await chime.leaveRoom(eventURL);
          await chime.createNetworkingLoungeRoom(loungeData.id, eventURL, IsFrom.NETWORKING_LOUNGE, isModerator);
          setMeetingStatus({ status: 'Succeeded' });
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

  const onLeaveNetworkingLounge = async (withEndSession = true) => {
    isMeetingLeft = true;
    setMeetingStatus({
      status: 'Loading',
      errorMessage: '',
    });
    chime.audioVideo && chime.audioVideo.removeObserver(observer);
    if (chime && withEndSession) {
      await chime.leaveRoom(eventURL);
    }
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();

    if (needToredirect) {
      setTimeout(() => {
        props.setActiveTab();
      }, 1000);
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
    // Leaving for PIP mode from lounges
    await chime.leaveRoom(eventURL);
    await new Promise((resolve) => setTimeout(resolve, 200));
    props.isPipMode({
      loungeData,
      isChimeMeetingPipMode: true,
      showPipModeVideo: true,
      videoCurrentURL: window.location.pathname,
      isFromPip: IsFrom.NETWORKING_LOUNGE,
      isCamEnabled,
      isMicMuted,
    });
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
  };

  const initializeMeeting = async () => {
    if (!isMounted?.current) return;
    isPipModeOpen = false;
    needToredirect = true;
    try {
      await chime.createNetworkingLoungeRoom(loungeData.id, eventURL, IsFrom.NETWORKING_LOUNGE, isModerator);
      setMeetingStatus({ status: 'Succeeded' });
      chime.audioVideo && (await chime.audioVideo.addObserver(observer));
      const showPopup = await chime.joinRoom(audioElement);
      const queryParams = getQueryParams();
      if ((queryParams && queryParams.showJoin === 'false') || showPopup) {
        await joinMeeting();
      } else {
        setShowDeviceSwitcherPopup(true);
      }
    } catch (error) {
      console.error(error);
      setMeetingStatus({
        status: 'Failed',
        errorMessage: error.message,
      });
    }
  };

  const resetMeetingAlert = () => setMeetingAlerts({ message: '' });

  useEffect(() => {
    if (!showPipModeVideo && loungeData && eventData) {
      initializeMeeting();
    }
    return async () => {
      if (!showPipModeVideo) {
        isMeetingLeft = true;
        needToredirect = false;
        await chime.leaveRoom(eventURL);
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

  const onContentShareEnabled = (isContentShareEnabled) => {
    setIsContentShareEnabled(isContentShareEnabled);
  };

  const onContentShareError = (isContentShareError) => {
    setIsContentShareError(isContentShareError);
  };

  return (
    <ContentShareProvider>
      <div className="networking-lounge-meeting">
        <audio ref={audioElement} className="d-none" />
        <div className="chime" id="chime-meeting-wrapper">
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
                  <Error errorMessage={t(meetingStatus.errorMessage)} onLeave={() => onLeaveNetworkingLounge(false)} />
                )}
                {meetingStatus.status === Status.Succeeded && (
                  <>
                    <div className={cx('left', showChimeSideBar && 'sidebar-toggle')}>
                      <ChimeHeader
                        meetingName={loungeData && loungeData.name}
                        toggleSettingsSideBar={() => {
                          setShowChimeSideBar(!showChimeSideBar);
                        }}
                        isFrom="LiveForum"
                      />
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
                                setShowChimeSideBar(!showChimeSideBar);
                              }}
                              onLeaveNetworkingLounge={onLeaveNetworkingLounge}
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
                    <div className={cx(showChimeSideBar ? 'right' : 'd-none')}>
                      <div className="roster-box">
                        <Roster
                          showMessage={showMessage}
                          leaveMeeting={() => onLeaveNetworkingLounge(false)}
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
                <Error
                  errorMessage={
                    pipLoungeData?.id === loungeData?.id
                      ? t('Pip mode is open')
                      : t('To join this session, close the PiP video window.')
                  }
                />
              </>
            )}
          </div>
        </div>

        <AEPopup
          id="mapPopup"
          showModal={showDeviceSwitcherPopup}
          headerText={<p className="mb-0">{t('common:Settings')}</p>}
          backdrop="static"
          headerClass="live-forum_room_title"
          backdropClassName={'BackColorOpacity'}
          onCloseFunc={() => onCloseDeviceSwitcherPopup()}
          custClassName={'settings-popup'}
        >
          <DeviceSelection joinMeeting={joinMeeting} />
        </AEPopup>
        <LeaveConfirmationPopup
          onLeaveFunc={onLeaveNetworkingLounge}
          message={t('Meeting leave successfully')}
          alertType={'success'}
          onRef={(ref) => setLeaveConfirmationPopup(ref)}
        />
      </div>
    </ContentShareProvider>
  );
}
const mapDispatchToProps = {
  storeWarnUserOnPageLeave,
  isPipMode,
  showAlert,
};
const mapStateToProps = (state) => ({
  user: getUserSession(state),
  eventData: getEventData(state),
  userRoleDetails: getUserRoleDetails(state),
  pipModeVideo: isPipModeVideoDetail(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(LiveForumroom);
