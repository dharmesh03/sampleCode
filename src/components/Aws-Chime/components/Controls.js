import cx from 'classnames';
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { ResizeObserver } from 'resize-observer';
import { debounce } from 'throttle-debounce';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import AETooltip from '../../../Core/Tooltip';
import { ViewMode, IsFrom } from '../enums/MeetingConstant';
import AEButton from '../../../Core/Button/Button';
import RaiseHand from './RaiseHand';
import AEInputField from '../../../Core/Input';
import AEIcons from '../../../Core/Icon/index';
import AEPopup from '../../../Core/Popup';
import useLocalVideoTile from '../hooks/useLocalVideoTile';
import { getLocalStorage } from '../../Widget/Utility/Utility';
import { useContentShareControls, useContentShareState } from '../providers/ContentShareProvider/index';

let resizeObserver;
export default function Controls(props) {
  const { viewMode, eventId, userId, breakoutRoomsLength } = props;
  const chime = useContext(getChimeContext());
  const { isVideoEnabled } = useLocalVideoTile();
  const { sharingAttendeeId, error } = useContentShareState();
  const { toggleContentShare, onContentShareError } = useContentShareControls();

  const [muted, setMuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState('Disabled');
  const [confirmationPopup, setConfirmationPopup] = useState(false);
  const boxElement = useRef(null);
  const { t } = useTranslation(['controller', 'common']);

  useEffect(() => {
    setVideoStatus(isVideoEnabled ? 'Enabled' : 'Disabled');
  }, [isVideoEnabled]);

  useEffect(() => {
    if (props?.onContentShareError) props?.onContentShareError(error);
  }, [error]);

  useEffect(() => {
    if (props?.onContentShareEnabled) props?.onContentShareEnabled(!!sharingAttendeeId);
  }, [sharingAttendeeId]);

  useEffect(() => {
    const callback = (localMuted) => {
      try {
        setMuted(localMuted);
      } catch (err) {
        chime.setStreamLog(err.stack);
      }
    };

    chime.audioVideo && chime.audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(callback);
    return () => {
      chime.audioVideo && chime.audioVideo.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback);
    };
  }, [chime.audioVideo]);

  const redirectToPeoplesPage = () => {
    if (props.leavePipModeMeeting && chime.isFrom === IsFrom.PIP_MODE_CHIME_MEETING) {
      props.leavePipModeMeeting();
    } else {
      setConfirmationPopup(true);
    }
  };

  const hidePopup = () => boxElement && boxElement.current && boxElement.current.handleHide();

  useEffect(() => {
    const centerBlock = document.querySelector('#chime-meeting-wrapper');
    window.addEventListener('resize', hidePopup());
    const handleResize = debounce(0, () => {
      hidePopup();
    });
    resizeObserver = new ResizeObserver(handleResize);
    if (centerBlock) resizeObserver.observe(centerBlock);

    return () => {
      const centerBlock = document.querySelector('#chime-meeting-wrapper');
      if (resizeObserver && centerBlock) resizeObserver.unobserve(centerBlock);
    };
  }, []);

  useEffect(() => {
    hidePopup();
  }, [sharingAttendeeId, viewMode]);

  const onLeaveAction = async () => {
    setConfirmationPopup(false);
    if (chime.isFrom === IsFrom.WORKSHOP && props.leaveWorkshop) {
      props.leaveWorkshop(true);
    } else if (chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM && props.leaveWorkshopBreakoutRoom) {
      props.leaveWorkshopBreakoutRoom(true);
    } else if (chime.isFrom === IsFrom.NETWORKING_LOUNGE && props.onLeaveNetworkingLounge) {
      props.onLeaveNetworkingLounge(true);
    } else if (chime.isFrom === IsFrom.EXHIBITOR_STUDIO && props.onLeaveExhibitorStudio) {
      props.onLeaveExhibitorStudio();
    } else {
      props.onLeave && props.onLeave(false);
    }
  };

  const handleFileChange = async (e) => {
    if (e?.target?.files?.length > 0) {
      const file = e.target.files[0];
      hidePopup();
      try {
        const contentVideoElement = document.getElementById('content-video-element-id');
        const stream = await chime.startContentShare(contentVideoElement, file);
        toggleContentShare(contentVideoElement, stream, 'VIDEO');
      } catch (err) {
        const type = err?.message === 'BrowserNotSupported' ? 'NOT_SUPPORTED' : 'ERROR';
        onContentShareError({
          type,
          level: type === 'ERROR' ? 'error' : 'warning',
          message: err.message,
        });
      }
    }
  };

  const muteUnmuteHandler = async () => {
    if (muted) {
      chime.isMicEnabled = true;
      chime.audioVideo && chime.audioVideo.realtimeUnmuteLocalAudio();
    } else {
      chime.audioVideo && chime.audioVideo.realtimeMuteLocalAudio();
    }
    // Adds a slight delay to close the tooltip before rendering the updated text in it
    await new Promise((resolve) => setTimeout(resolve, 10));
  };

  const videoEnableDisableHandler = async () => {
    // Adds a slight delay to close the tooltip before rendering the updated text in it
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (videoStatus === 'Disabled') {
      setVideoStatus('Loading');
      try {
        if (!chime.currentVideoInputDevice) {
          throw new Error('currentVideoInputDevice does not exist');
        }
        chime.isCamEnabled = true;
        await chime.chooseVideoInputDevice(chime.currentVideoInputDevice);

        const vbData =
          getLocalStorage('virtualBackgroundEffect') !== undefined &&
          getLocalStorage('virtualBackgroundEffect') !== null
            ? getLocalStorage('virtualBackgroundEffect')
            : null;

        // eslint-disable-next-line
        if (vbData && eventId == vbData.eventId && userId == vbData.userId) {
          await chime.setVirtualBackgroundEffect(vbData.effectType, vbData.value, eventId, userId);
        } else {
          await chime?.audioVideo?.startLocalVideoTile();
        }
        setVideoStatus('Enabled');
      } catch (error) {
        // eslint-disable-next-line
        console.error(error);
        setVideoStatus('Disabled');
      }
    } else if (videoStatus === 'Enabled') {
      setVideoStatus('Loading');
      await chime?.audioVideo?.stopVideoInput();
      setVideoStatus('Disabled');
    }
  };

  const popoverTop = (
    <Popover
      id="popover-positioned-top"
      key="test_overlay"
      className="share-option"
      title={
        <div className="d-flex justify-content-between">
          <span className="share-option-title">{t('common:ShareOptions')}</span>
          <AEIcons
            type="ac-icon-close"
            aria-label="Close share screen settings"
            className="share-screen--close outline_offset_2"
            onClick={hidePopup}
            tabIndex="0"
            id="close"
          />
        </div>
      }
    >
      {viewMode !== ViewMode.ScreenShare && !sharingAttendeeId ? (
        <div className="text-center">
          <AEButton
            className="reserved-button screen-share-button"
            type="button"
            onClick={() => {
              const contentVideoElement = document.getElementById('content-video-element-id');
              hidePopup();
              toggleContentShare(contentVideoElement);
            }}
            aria-label="Share current screen"
            id="currentScreen"
          >
            <AEIcons type="fa fa-desktop" />
          </AEButton>

          <AEButton
            type="button"
            className="m-l-20 reserved-button screen-share-button"
            onClick={() => {
              const videoPresentationUpload = document.getElementById('videoPresentationUpload');
              if (videoPresentationUpload) {
                videoPresentationUpload.click();
              }
            }}
            aria-label="Upload video and share"
            id="uploadShare"
          >
            <AEIcons type="fa fa-video-camera" />
          </AEButton>
          <AEInputField
            type="file"
            id="videoPresentationUpload"
            accept="video/*"
            onChange={(e) => {
              handleFileChange(e);
            }}
            className="d-none"
            size="normal"
          />
        </div>
      ) : (
        <div className="text-center">
          <p className="title-head-font-color">{t('common:ScreenOrVideoAlreadyShared')}</p>
        </div>
      )}
      <div className="anchor-popup" />
    </Popover>
  );

  const customPopoverTop = () => (
    <Popover className=" b-rad-16" id="popover-positioned-top">
      <div>
        <h5>{t('BreakoutRoom')}</h5>
        <p className="help-text">{t('BreakoutRoomInformation')}</p>
      </div>
      <div className="anchor-popup" />
    </Popover>
  );

  const isBreakoutRoomBtnDisable = chime.isFrom === IsFrom.WORKSHOP && !chime.isModerator && !(breakoutRoomsLength > 0);

  const WorkshopAdminPopUp = () => (
    <OverlayTrigger placement="top" overlay={customPopoverTop('Create breakout rooms')}>
      <AEButton
        type="button"
        className="muteButton mobile-control-button reserved-button"
        id="breakoutRoom"
        onClick={() => {
          props.toggleBreakoutSideBar();
        }}
        aria-label="Create breakout rooms"
      >
        <AEIcons type="icon virtual-icon-expo-outlined mobile-icon-change" />
      </AEButton>
    </OverlayTrigger>
  );

  const WorkshopAdminToolTip = () => (
    <AETooltip
      tooltip={t('endBreakoutRoom')}
      overlayProps={{
        placement: 'top',
      }}
      tooltipProps={{ id: 'breakoutRoomUserToolTip' }}
    >
      <div>
        <AEButton
          type="button"
          className="muteButton mobile-control-button reserved-button"
          id="breakoutRoom"
          onClick={() => {
            props.toggleBreakoutSideBar();
          }}
          aria-label="Create breakout rooms"
        >
          <AEIcons type="icon virtual-icon-expo-outlined mobile-icon-change" />
        </AEButton>
      </div>
    </AETooltip>
  );

  const WorkshopUserToolTip = () => (
    <AETooltip
      tooltip={
        chime.isFrom === IsFrom.WORKSHOP
          ? !(breakoutRoomsLength > 0)
            ? t('userMustBeAModerator')
            : t('joinBreakoutRooms')
          : chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM && t('switchBreakoutRooms')
      }
      overlayProps={{
        placement: 'top',
      }}
      tooltipProps={{ id: 'breakoutRoomUserToolTip' }}
    >
      <div>
        <AEButton
          type="button"
          className={`muteButton mobile-control-button reserved-button ${
            isBreakoutRoomBtnDisable ? 'disabledBreakoutRoomBtn' : ''
          }`}
          id="breakoutRoom"
          disabled={isBreakoutRoomBtnDisable}
          onClick={() => {
            props.toggleBreakoutSideBar();
          }}
          aria-label="Create breakout rooms"
        >
          <AEIcons type="icon virtual-icon-expo-outlined mobile-icon-change" />
        </AEButton>
      </div>
    </AETooltip>
  );
  return (
    <div
      className={cx('controls controls-panel', {
        roomMode: viewMode === ViewMode.Room,
        screenShareMode: viewMode === ViewMode.ScreenShare,
        videoEnabled: videoStatus === 'Enabled',
        audioMuted: muted,
      })}
    >
      <div className="micMuted">{'Mic muted'}</div>
      <ul id="workshop-controls" className={cx('control-icons-list', 'dis-in-flex')}>
        <li>
          <AETooltip
            tooltip={
              !chime.isMicrophoneAccessible ? (
                t('MicrophoneNotAccessible')
              ) : muted ? (
                t('ClickHereToUnmuteYourself')
              ) : (
                <span>&nbsp;{t('ClickHereToMuteYourself')}&nbsp;</span>
              )
            }
            overlayProps={{
              placement: chime.isFrom === IsFrom.NETWORKING || chime.isFrom === IsFrom.ONE_TO_ONE_CALL ? 'top' : 'top',
            }}
          >
            <div className={chime.isFrom === IsFrom.NETWORKING ? 'm-t-10 ' : ''}>
              {/* wrapping AEButton to div for solving tooltip flickring issue (DEV-14420)  */}
              <AEButton
                className={cx('mobile-control-button reserved-button', muted && 'btn-pulse-animation', {
                  enabled: !muted,
                })}
                id="muteUnmute"
                onClick={async () => {
                  muteUnmuteHandler();
                }}
                aria-label={
                  !chime.isMicrophoneAccessible
                    ? 'Microphone is not accessible from your end.'
                    : muted
                    ? 'Click here to unmute yourself.'
                    : 'Click here to mute   yourself.'
                }
              >
                {chime.isMicrophoneAccessible ? (
                  muted ? (
                    <AEIcons
                      svgIcon="virtual-icon-bar-microphone-mute"
                      viewBox="0 0 28 28"
                      size="small"
                      dataPrefix="fas"
                      dataIcon="microphone-slash"
                    />
                  ) : (
                    <AEIcons
                      svgIcon="virtual-icon-bar-microphone-unmute"
                      viewBox="0 0 28 28"
                      size="small"
                      dataPrefix="fas"
                      dataIcon="microphone"
                    />
                  )
                ) : (
                  <AEIcons
                    svgIcon="virtual-icon-bar-microphone-mute"
                    viewBox="0 0 28 28"
                    size="small"
                    dataPrefix="fas"
                    dataIcon="microphone-slash"
                  />
                )}
              </AEButton>
            </div>
          </AETooltip>
        </li>
        <li>
          <AETooltip
            tooltip={
              !chime.isCameraAccessible
                ? t('CameraNotAccessible')
                : videoStatus === 'Enabled'
                ? t('ClickHereToTurnOffCamera')
                : t('ClickHereToTurnOnCamera')
            }
            overlayProps={{
              placement: chime.isFrom === IsFrom.NETWORKING || chime.isFrom === IsFrom.ONE_TO_ONE_CALL ? 'top' : 'top',
            }}
          >
            <div className={chime.isFrom === IsFrom.NETWORKING ? 'm-t-10 ' : ''}>
              <AEButton
                type="button"
                className={cx('videoButton reserved-button mobile-control-button', {
                  enabled: videoStatus === 'Enabled',
                })}
                id="cameraOnOff"
                onClick={async () => {
                  videoEnableDisableHandler();
                }}
                aria-label={
                  !chime.isCameraAccessible
                    ? 'Camera is not accessible from your end.'
                    : videoStatus === 'Enabled'
                    ? 'Click here to turn off Camera.'
                    : 'Click here to turn on Camera.'
                }
              >
                <span id="cameraOnOffIcon">
                  {videoStatus === 'Enabled' ? (
                    <AEIcons svgIcon="virtual-icon-bar-camera-on" viewBox="0 0 28 28" />
                  ) : (
                    <AEIcons svgIcon="virtual-icon-bar-camera-off" viewBox="0 0 28 28" />
                  )}
                </span>
              </AEButton>
            </div>
          </AETooltip>
        </li>
        <li>
          {(chime.isFrom === IsFrom.WORKSHOP || chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM) &&
            (chime.isModerator ? (
              chime.isFrom === IsFrom.WORKSHOP ? (
                <WorkshopAdminPopUp />
              ) : (
                <WorkshopAdminToolTip />
              )
            ) : (
              <WorkshopUserToolTip />
            ))}
        </li>
        <li>
          {chime.isFrom !== IsFrom.PIP_MODE_CHIME_MEETING && (
            <AETooltip tooltip={t('ClickHereToShare')} overlayProps={{ placement: 'top' }}>
              <div>
                <OverlayTrigger
                  target={`shareScreen`}
                  ref={boxElement}
                  rootClose
                  trigger="click"
                  placement="top"
                  overlay={popoverTop}
                  container={document.querySelector('#workshop-controls')}
                >
                  <AEButton
                    type="button"
                    id="shareScreen"
                    className="shareButton reserved-button d-none d-sm-none d-md-inline"
                    onClick={() => {
                      props.setIsOpenInviteBox && props.setIsOpenInviteBox(null, false);
                    }}
                    aria-label="Click here to share screen"
                  >
                    <AEIcons viewBox="0 0 28 28" svgIcon="virtual-icon-bar-share-screen" />
                  </AEButton>
                </OverlayTrigger>
              </div>
            </AETooltip>
          )}
        </li>
        <li>
          {chime.isFrom === IsFrom.ONE_TO_ONE_CALL && (
            <AETooltip
              tooltip={t('ClickHereToInvitePeople')}
              overlayProps={{
                placement:
                  chime.isFrom === IsFrom.NETWORKING || chime.isFrom === IsFrom.ONE_TO_ONE_CALL ? 'top' : 'top',
              }}
            >
              <div>
                <AEButton
                  type="button"
                  className="muteButton mobile-control-button reserved-button"
                  id="invite_people"
                  onClick={(e) => {
                    hidePopup();
                    props.setIsOpenInviteBox(e, true);
                  }}
                  aria-label="Click here to invite People."
                >
                  <AEIcons viewBox="0 0 28 28" svgIcon="virtual-icon-user-invite-people" />
                </AEButton>
              </div>
            </AETooltip>
          )}
        </li>
        <li>
          <RaiseHand />
        </li>
        <li>
          {chime.isFrom !== IsFrom.ONE_TO_ONE_CALL && chime.isFrom !== IsFrom.PIP_MODE_CHIME_MEETING && (
            <AETooltip
              tooltip={
                chime.isFrom === IsFrom.NETWORKING ? t('ClickHereToOpenSettings') : t('ClickHereToOpenAttendeesList')
              }
              overlayProps={{ placement: 'top' }}
            >
              <div className={chime.isFrom === IsFrom.NETWORKING ? 'm-t-10 ' : ''}>
                <AEButton
                  type="button"
                  id="open_device_settings"
                  className="muteButton mobile-control-button reserved-button"
                  onClick={() => {
                    props.toggleSettingsSideBar();
                  }}
                  aria-label={
                    chime.isFrom === IsFrom.NETWORKING
                      ? 'Click here to open settings. '
                      : 'Click here to open attendees list.'
                  }
                >
                  {chime.isFrom === IsFrom.NETWORKING ? (
                    <AEIcons className="icon ac-icon-settings mobile-icon-change" viewBox="0 0 28 28" />
                  ) : (
                    <AEIcons svgIcon="virtual-icon-bar-users" viewBox="0 0 28 28" />
                  )}
                </AEButton>
              </div>
            </AETooltip>
          )}
        </li>
        <li>
          {viewMode !== ViewMode.ScreenShare && (
            <AETooltip
              tooltip={chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ? t('LeaveRoom') : t('ClickHereToExit')}
              overlayProps={{ placement: 'top' }}
            >
              <div className={chime.isFrom === IsFrom.NETWORKING ? 'm-t-10 ' : ''}>
                <AEButton
                  type="button"
                  className="endButton reserved-button"
                  id="closeScreen"
                  onClick={() => {
                    if (chime.isFrom === IsFrom.NETWORKING) {
                      props.leaveNetworking();
                    } else {
                      redirectToPeoplesPage();
                    }
                  }}
                  variant="danger"
                  aria-label="Click here to close screen share"
                >
                  {chime.isFrom !== IsFrom.PIP_MODE_CHIME_MEETING ? (
                    <AEIcons svgIcon="virtual-icon-bar-call-end" viewBox="0 0 28 28" size="small" />
                  ) : (
                    <AEIcons size="medium" style={{ 'font-size': '18px' }} type="ac-icon-external-link" />
                  )}
                </AEButton>
              </div>
            </AETooltip>
          )}
        </li>
      </ul>

      <AEPopup
        onCloseFunc={() => setConfirmationPopup(false)}
        id="confirmationPopup"
        showModal={confirmationPopup}
        isFromAccessPortalPage
        headerText={
          <p className="transcription-modal-header">
            {chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM
              ? t('common:Leave Breakout Room')
              : t('common:Leave Session')}
          </p>
        }
        modelFooter={
          <div className="m-t-48">
            <AEButton
              className="reserved-button m-r-10 height-48 width-141"
              onClick={() => {
                setConfirmationPopup(false);
              }}
              label={t('common:Stay')}
              aria-label="Are you sure want to leave? Stay."
              id="stay"
              variant="secondary"
            />
            <AEButton
              className="reserved-button height-48 width-141 m-l-10"
              onClick={() => {
                onLeaveAction();
              }}
              variant="primary"
              label={t('common:Leave')}
              aria-label="Are you sure want to leave? Leave."
              id="leave"
            />
          </div>
        }
      >
        <div className="leave-confirmation-popup">
          {chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ? t('YouAreLeavingBreakOutRoom') : t('AreYouSureWantToLeave')}
        </div>
      </AEPopup>
    </div>
  );
}
