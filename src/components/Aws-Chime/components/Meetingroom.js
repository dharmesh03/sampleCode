import cx from 'classnames';
import { Popover, Overlay } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import size from 'lodash/size';
import getChimeContext from '../context/getChimeContext';
import Controls from './Controls';
import DeviceSwitcher from './DeviceSwitcher';
import Error from './Error';
import DeviceSelection from './NewDeviceSelection';
import { ViewMode, Status, IsFrom, MessageTopic } from '../enums/MeetingConstant';
import { storeWarnUserOnPageLeave } from '../../../routes/admin/action';
import { storeCallDetail } from '../../../routes/event/portal/people/action/index';
import { getUserSession } from '../../../routes/login/action/selector';
import { getEventData } from '../../../routes/event/action/selector';
import LeaveConfirmationPopup from './LeaveConfirmationPopup';
import { getCallDetail } from '../../../routes/event/action/selectorVirtualEvent';
import { setChatWindowData } from '../../WebChat/action';
import WithParams from '../../WrapperComponents/WithParams';
import InvitePeople from './InvitePeople';
import AESpinner from '../../../Core/Spinner/Spinner';
import CustomControls from './CustomControls';
import { checkIsFromMeetingRoom, isPipMode, showAlert } from '../../../routes/event/action/portalAction';
import MeetingAlerts from './MeetingAlerts';
import TileLayout from './TileLayout';
import AEPopup from '../../../Core/Popup';
import { getLocalStorage } from '../../Widget/Utility/Utility';
import useAnaylics from '../hooks/useAnaylitics';
import { ContentShareProvider, ContentShareErrorType } from '../providers/ContentShareProvider';
import useIsMounted from '../../../hooks/useIsMounted';

let isJoinedNewMeeting = false;
let isShowAlert = false;
function Meetingroom(props) {
  const { callStatus, warnUserOnStateUpdate, params, meetingId, isInvited, loggedInUser, user, eventData } = props;
  const chime = useContext(getChimeContext());
  useAnaylics({ eventData, user, isFrom: IsFrom.ONE_TO_ONE_CALL, meetingId: callStatus?.meetingScheduleId });
  const [meetingStatus, setMeetingStatus] = useState({
    status: Status.Loading,
    errorMessage: '',
  });
  const [viewMode, setViewMode] = useState(ViewMode.Room);
  const [isModeTransitioning] = useState(false);
  const [isContentShareError, setIsContentShareError] = useState(false);
  const [isContentShareEnabled, setIsContentShareEnabled] = useState(false);
  const [showChimeSideBar, setShowChimeSideBar] = useState(false);
  const [showDeviceSwitcherPopup, setShowDeviceSwitcherPopup] = useState(false);
  const [presentAttendees, setPresentAttendees] = useState([]);
  const [curruntMeetingId, setCurruntMeetingId] = useState('');
  const [leaveConfirmationPopup, setLeaveConfirmationPopup] = useState(false);
  const [isOpenInviteBox, setIsOpenInviteBox] = useState(false);
  const [target, setTarget] = useState(null);
  const [watchRoster, setWatchRoster] = useState(false);
  const [meetingAlerts, setMeetingAlerts] = useState({ message: '' });

  const isMounted = useIsMounted();
  const audioElement = useRef(null);

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
          if (attendeeId === chime.attendeeId) return;
          if (type === 'ATTENDEEPROFILE') {
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
    if (!chime?.isMicEnabled) {
      await chime?.audioVideo?.realtimeMuteLocalAudio();
    }
    await chime.refreshAudioInputDevice();
    setTimeout(() => {
      chime.sendMessage(MessageTopic.GeneralDataMessage, {
        type: 'ATTENDEEPROFILE',
        profilePic: chime?.attendees[chime?.attendeeId]?.profilePic,
        firstName: chime?.attendees[chime?.attendeeId]?.firstName,
        lastName: chime?.attendees[chime?.attendeeId]?.lastName,
      });
    }, 2000);
  };

  const leaveMeeting = async (withEndSession = true) => {
    if (withEndSession) {
      await chime.leaveRoom(params.params);
    }
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
    !isShowAlert && showMessage(t('The call has ended'), false);
    isShowAlert = true;
    props.checkIsFromMeetingRoom(true);
    if (warnUserOnStateUpdate && warnUserOnStateUpdate.selectedLink) {
      return;
    }

    if (!isJoinedNewMeeting) {
      const preUrl = (callStatus && callStatus.currentUrl) || '';
      props.setChatWindowData({ type: 'RESET_ON_CALL_END' });
      props.storeCallDetail({ videoCall: false, userId: null, name: null, currentUrl: '', isCalling: false });
      setTimeout(() => {
        if (preUrl && preUrl.indexOf('meetingRoom') === -1) {
          props.history.push(preUrl);
        } else {
          props.history.push(`/e/${params && params.params}/portal/people`);
        }
      }, 100);
    } else {
      isJoinedNewMeeting = false;
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
      } else if (sessionStatus.status === 'Left' || sessionStatus.status === 'AudioCallEnded') {
        leaveMeeting();
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

  const presentAttendeeInfo = async () => {
    const callback = async (presentAttendeeId, present) => {
      try {
        if (presentAttendeeId.indexOf('#content') === -1) {
          const index = presentAttendees && presentAttendees.indexOf(presentAttendeeId);
          if (present && index < 0) {
            presentAttendees.push(presentAttendeeId);
            setPresentAttendees(presentAttendees);
          } else if (!present && size(presentAttendees) === 2 && index > -1) {
            setPresentAttendees([]);
            leaveMeeting(true);
          } else if (!present && size(presentAttendees) > 2 && index > -1) {
            presentAttendees.splice(index, 1);
            setPresentAttendees(presentAttendees);
          }
        }
      } catch (err) {
        chime.setStreamLog(err.stack);
      }
    };
    chime.audioVideo && (await chime.audioVideo.realtimeSubscribeToAttendeeIdPresence(callback));
  };

  const initializeMeeting = async (meetingId) => {
    if (!isMounted?.current) return;
    const { warnUserOnStateUpdate } = props;
    if (warnUserOnStateUpdate && warnUserOnStateUpdate.stateUpdated) {
      props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
    }
    const { userId } = loggedInUser || {};
    try {
      await chime.createMeetingRoom(meetingId, params.params, IsFrom.ONE_TO_ONE_CALL, userId);
      setMeetingStatus({
        status: Status.Succeeded,
      });
      chime.audioVideo && (await chime.audioVideo.addObserver(observer));
      presentAttendeeInfo();
      const showPopup = await chime.joinRoom(audioElement);
      if (chime.iOS() || showPopup) {
        joinMeeting();
      } else {
        setShowDeviceSwitcherPopup(true);
      }
      setTimeout(() => setWatchRoster(true), 30000);
    } catch (error) {
      setMeetingStatus({
        status: Status.Failed,
        errorMessage: error.message,
      });
    }
  };

  const openIvitebox = (e, state) => {
    e && setTarget(e.target);
    setIsOpenInviteBox(state);
  };

  const resetMeetingAlert = () => setMeetingAlerts({ message: '' });

  useEffect(() => {
    if (curruntMeetingId && meetingId !== curruntMeetingId) {
      setMeetingStatus({
        status: Status.Loading,
      });
      chime.audioVideo && chime.audioVideo.stop();
      isJoinedNewMeeting = true;
      setCurruntMeetingId(meetingId);
      setTimeout(() => {
        isShowAlert = false;
        initializeMeeting(meetingId);
      }, 3000);
    }
  }, [meetingId]);

  useEffect(() => {
    if (watchRoster) {
      if (Object.keys(chime.roster).length && Object.keys(chime.roster).length < 2) {
        leaveMeeting();
      }
    }
  }, [watchRoster]);

  useEffect(() => {
    props.isPipMode({
      showPipModeVideo: false,
    });
    if (!callStatus && !isInvited) {
      leaveMeeting();
    } else if (meetingId && !curruntMeetingId) {
      setCurruntMeetingId(meetingId);
      setTimeout(() => {
        isShowAlert = false;
        initializeMeeting(meetingId);
      }, 1000);
    }
    return async () => {
      props.storeCallDetail({ videoCall: false, userId: null, name: null, currentUrl: '', isCalling: false });
      await chime.leaveRoom(params.params);
      props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
    };
  }, []);

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
    // <div className="meeting-room">
    <ContentShareProvider>
      <div className="meeting-room-container">
        <div className="chime local-video-box" id="chime-meeting-wrapper">
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
            {meetingStatus.status === Status.Loading && <AESpinner type="SpinnerSmall" />}
            {meetingStatus.status === Status.Failed && (
              <Error errorMessage={t(meetingStatus.errorMessage)} onLeave={() => leaveMeeting(false)} />
            )}
            {meetingStatus.status === Status.Succeeded && (
              <>
                <div className={cx('left', showChimeSideBar && 'sidebar-toggle')}>
                  <TileLayout isContentShareEnabled={isContentShareEnabled} viewMode={viewMode} />
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
                          onLeave={leaveMeeting}
                          showMessage={showMessage}
                          setIsOpenInviteBox={openIvitebox}
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
                  <div className="deviceSwitcher overflow-y-auto">
                    <DeviceSwitcher
                      toggleSettingsSideBar={() => {
                        setShowChimeSideBar(!showChimeSideBar);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            <AEPopup
              id="mapPopup"
              showModal={showDeviceSwitcherPopup}
              headerText={<p className="mb-0">{t('common:Settings')}</p>}
              backdrop="static"
              backdropClassName={'BackColorOpacity'}
              onCloseFunc={() => leaveMeeting()}
              custClassName={'modal-video-call settings-popup'}
            >
              <DeviceSelection joinMeeting={joinMeeting} />
            </AEPopup>
            <LeaveConfirmationPopup
              onLeaveFunc={leaveMeeting}
              message={t('Meeting leave successfully')}
              alertType={'success'}
              onRef={(ref) => setLeaveConfirmationPopup(ref)}
            />
          </div>
        </div>
        <Overlay
          show={isOpenInviteBox}
          id={'overlayTargetInvite'}
          target={target}
          placement="top"
          rootClose="true"
          container={this}
          trigger="click"
          containerPadding={20}
        >
          <Popover id="popover-contained-invite" className="invite-box">
            <InvitePeople
              params={params}
              showMessage={showMessage}
              setIsOpenInviteBox={() => {
                setIsOpenInviteBox(false);
              }}
            />
          </Popover>
        </Overlay>
      </div>
    </ContentShareProvider>
  );
}
const mapDispatchToProps = {
  storeWarnUserOnPageLeave,
  storeCallDetail,
  setChatWindowData,
  checkIsFromMeetingRoom,
  isPipMode,
  showAlert,
};
const mapStateToProps = (state) => ({
  user: getUserSession(state),
  eventData: getEventData(state),
  callStatus: getCallDetail(state),
  warnUserOnStateUpdate: state.host && state.host.warnUserOnStateUpdate,
  loggedInUser: getUserSession(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(Meetingroom));
