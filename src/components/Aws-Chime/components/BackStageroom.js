import React, { useContext, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import ContentVideo from './ContentVideo';
import RemoteVideoGroup from './RemoteVideoGroup';
import DeviceSwitcher from './DeviceSwitcher';
import ScreenShareHeader from './ScreenShareHeader';
import Roster from './Roster';
import Alerts from '../../Widget/Alerts';
import DeviceSelection from './NewDeviceSelection';
import Error from './Error';
import SideBarControls from './SideBarControls';
import { getUserRoleDetails } from '../../../routes/event/action/selectorVirtualEvent';
import { getUserSession } from '../../../routes/login/action/selector';
import { getEventData } from '../../../routes/event/action/selector';
import LeaveConfirmationPopup from './LeaveConfirmationPopup';
import { storeWarnUserOnPageLeave } from '../../../routes/admin/action';
import { camelToTitleCase } from '../../Widget/Utility/jsFunction';
import getChimeContext from '../context/getChimeContext';
import { ViewMode, IsFrom, MessageTopic, Status } from '../enums/MeetingConstant';
import WithParams from '../../WrapperComponents/WithParams';
import AEButton from '../../../Core/Button/Button';
import AEBadge from '../../../Core/Badge/Badge';
import AELabel from '../../../Core/Label/label';
import AESpinner from '../../../Core/Spinner/Spinner';
import AEPopup from '../../../Core/Popup';
import { ContentShareProvider, useContentShareState } from '../providers/ContentShareProvider';

function BackStageroom(props) {
  const {
    params,
    userRoleDetails,
    eventData,
    session,
    loggedInUser,
    isBroadCastStarted,
    showStatusPopup,
    isAdminOrSessionModerator,
  } = props;
  const chime = useContext(getChimeContext());
  const { sharingAttendeeId: isContentShareEnabled } = useContentShareState();
  const [viewMode] = useState(ViewMode.Room);
  const [isModeTransitioning] = useState(false);
  const [showChimeSideBar, setShowChimeSideBar] = useState(false);
  const [showDeviceSwitcherPopup, setShowDeviceSwitcherPopup] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });
  const isModerator = userRoleDetails && (userRoleDetails.admin || userRoleDetails.staff || userRoleDetails.speaker);
  const [leaveConfirmationPopup, setLeaveConfirmationPopup] = useState(false);

  const { t } = useTranslation(['chime', 'studioPage', 'common']);

  const audioElement = useRef(null);

  const showMessage = (message, isError) => {
    setMessage(message);
    setIsError(isError);
    setLoading(false);
    setTimeout(() => {
      setMessage('');
    }, 4000);
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
            // chime.audioVideo.removeLocalVideoTile();
          }
        } catch (err) {
          chime.setStreamLog(err.stack);
        }
      }));
  };

  const joinMeeting = async () => {
    setShowDeviceSwitcherPopup(false);
    chime.audioVideo && (await chime.audioVideo.start());
    await new Promise((resolve) => setTimeout(resolve, 2500));
    props.storeWarnUserOnPageLeave({ stateUpdated: true, showPopupForSaveSetting: false, selectedLink: '' });
    chime.storeSelectedDevices();
    realtimeSubscribeToReceiveGeneralDataMessage();
    chime.audioVideo && (await chime.audioVideo.startLocalVideoTile());
    await chime.refreshAudioInputDevice();
    if (!isModerator) {
      chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
    }
  };

  const onCloseDeviceSwitcherPopup = async () => {
    setShowDeviceSwitcherPopup(false);
    await chime.leaveRoom(params.params);
    props.history.push(`/e/${params.params}/portal`);
  };

  const leaveStudio = async (withEndSession = true) => {
    if (chime && withEndSession) {
      await chime.leaveRoom(params.params);
    }
    leaveConfirmationPopup && leaveConfirmationPopup.startLeaveHandler();
    props.history.push(`/e/${params.params}/portal`);
  };

  const initializeMeeting = async () => {
    const { warnUserOnStateUpdate } = props;
    if (warnUserOnStateUpdate && warnUserOnStateUpdate.stateUpdated) {
      props.storeWarnUserOnPageLeave({ stateUpdated: false, showPopupForSaveSetting: false, selectedLink: '' });
    }
    try {
      await chime.createWorkshopRoom(params.sessionId, params.params, IsFrom.BACKSTAGEROOM, isModerator);
      setMeetingStatus({
        status: 'Succeeded',
      });
      chime.audioVideo &&
        (await chime.audioVideo.addObserver({
          audioVideoDidStop: async (status) => {
            const sessionStatus = await chime.getChimeMeetingStatus(status);
            if (sessionStatus.status === 'AudioJoinedFromAnotherDevice') {
              setMeetingStatus({
                status: 'Failed',
                errorMessage: sessionStatus.message,
              });
            } else if (sessionStatus.status === 'Left' || sessionStatus.status === 'AudioCallEnded') {
              leaveStudio();
            } else {
              showMessage(t(sessionStatus.message), true);
            }
          },
          audioVideoDidStartConnecting: (reconnecting) => {
            if (reconnecting) {
              setMeetingStatus({
                status: 'Failed',
                errorMessage: 'Reconnecting',
              });
            } else {
              setMeetingStatus({
                status: 'Succeeded',
              });
            }
          },
        }));
      await chime.joinRoom(audioElement);
      if (chime.iOS()) {
        joinMeeting();
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

  useEffect(() => {
    if (params && params.sessionId && params.params) {
      initializeMeeting();
    }
  }, []);

  return (
    <div className="width-100-percent back-stage-room">
      {message && <Alerts message={message} loading={loading} isError={isError} />}
      <audio ref={audioElement} className="d-none" />
      {meetingStatus.status === Status.Succeeded && (
        <div className="sidebar-control">
          <SideBarControls
            viewMode={viewMode}
            isContentShareEnabled={isContentShareEnabled}
            toggleSettingsSideBar={() => {
              setShowChimeSideBar(!showChimeSideBar);
            }}
            user={loggedInUser}
            eventData={eventData}
            onLeave={leaveStudio}
          />
        </div>
      )}
      <div className="container-screen">
        <div className="studio-header">
          <div className="col-md-8 d-flex align-items-center">
            <AELabel header={session.title || ''} variant={'heading4'} />
            <AEBadge className="m-l-10" variant="success">
              {session.format ? t(`common:${camelToTitleCase(session.format.toLowerCase().replace('_', ' '))}`) : ''}
            </AEBadge>
          </div>
          {isAdminOrSessionModerator && (
            <div className="broadcast-btn">
              {!isBroadCastStarted ? (
                <div className="m-t-5">
                  <AEButton
                    loading={showStatusPopup}
                    onClick={() => {
                      props.startBroadcast();
                    }}
                    variant="success"
                    label={t('studioPage:Start Broadcast')}
                  />
                </div>
              ) : (
                <div className="m-t-5">
                  <AEButton
                    onClick={() => {
                      props.toggleWarnPopup();
                    }}
                    variant="danger"
                    className="m-r-10"
                    label={t('studioPage:Stop Broadcast')}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="chime" id="chime-meeting-wrapper">
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
              <Error errorMessage={t(meetingStatus.errorMessage)} onLeave={() => leaveStudio(false)} />
            )}
            {meetingStatus.status === Status.Succeeded && (
              <>
                <>
                  <div className={cx('left', showChimeSideBar && 'sidebar-toggle')}>
                    {isContentShareEnabled && <ScreenShareHeader />}
                    <div className="contentVideoWrapper">
                      <ContentVideo />
                    </div>
                    <div className="remoteVideoGroupWrapper">
                      <RemoteVideoGroup
                        isFrom={IsFrom.BACKSTAGEROOM}
                        viewMode={viewMode}
                        isContentShareEnabled={isContentShareEnabled}
                      />
                    </div>
                  </div>
                  <div className={cx(showChimeSideBar ? 'right' : 'd-none')}>
                    <div className="deviceSwitcher overflow-y-auto">
                      <DeviceSwitcher
                        isModerator={isModerator}
                        toggleSettingsSideBar={() => {
                          setShowChimeSideBar(!showChimeSideBar);
                        }}
                      />
                    </div>
                    <div className="roster-box">
                      <Roster isModerator={isModerator} showMessage={showMessage} />
                    </div>
                  </div>
                </>
              </>
            )}
          </div>
        </div>
      </div>
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
        onLeaveFunc={leaveStudio}
        message={t('Studio leave successfully')}
        alertType={'success'}
        onRef={(ref) => setLeaveConfirmationPopup(ref)}
      />
    </div>
  );
}
const mapDispatchToProps = {
  storeWarnUserOnPageLeave,
};
const mapStateToProps = (state) => ({
  eventData: getEventData(state),
  userRoleDetails: getUserRoleDetails(state),
  loggedInUser: getUserSession(state),
  warnUserOnStateUpdate: state.host && state.host.warnUserOnStateUpdate,
});

export const BackStageroomWrapper = (props) => (
  <ContentShareProvider>
    <BackStageroom {...props} />
  </ContentShareProvider>
);

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(BackStageroomWrapper));
