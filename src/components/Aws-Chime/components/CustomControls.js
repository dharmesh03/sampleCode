import React, { useState, useEffect, useContext } from 'react';
import { SketchPicker } from 'react-color';
import { connect } from 'react-redux';
import moment from 'moment-timezone';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import useRosterCount from '../hooks/useRosterCount';
import { AEDropDown, AEMenuItem } from '../../../Core/Dropdown';
import AETooltip from '../../../Core/Tooltip';
import AEIcons from '../../../Core/Icon/index';
import AEButton from '../../../Core/Button/Button';
import { IsFrom, MessageTopic } from '../enums/MeetingConstant';
import { getTimeInLocal } from '../../../routes/event/action/index';
import DeviceSetting from './DeviceSetting';
import LayoutOptions from './LayoutOptions';
import getChimeContext from '../context/getChimeContext';
import LiveTranscriptionModal from './LiveTranscriptionModal';
import { APP_ENV } from '../../../clientConfig';
import AEImageUploader from '../../Widget/UploadFile/AEImageUploader';
import { setChimeTranscription } from '../action/index';
import { selectorChimeTranscription } from '../action/selectorChime';
import AEPopup from '../../../Core/Popup';

let countDownInterval;
function CustomControls(props) {
  const chime = useContext(getChimeContext());
  const rosterCount = useRosterCount();
  const {
    children,
    meetingName,
    meetingTime,
    equivalentTimezone,
    configData,
    onLayoutChange,
    viewMode,
    handlePipMode,
    showMessage,
    transcription,
    eventId,
    userId,
  } = props || {};
  const { t } = useTranslation(['controller', 'deviceSelection', 'common', 'tooltipMsg', 'chime']);
  const { isHideTranscriptionContainer, enableLiveTranscription } = transcription || {};
  const { muteAttendeesOnEntry, disableAttendeesCameraOnEntry } = configData || {};
  const isWorkshopModerator =
    chime.isModerator && (chime.isFrom === IsFrom.WORKSHOP || chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM);
  const [showSetting, setShowSetting] = useState(false);
  const [showLayoutPopup, setShowLayoutPopup] = useState(false);
  const [showTranscriptionPopup, setShowTranscriptionPopup] = useState(false);
  const [isVoiceFocusEnabled, setIsVoiceFocusEnabled] = useState(false);
  const [meetingEntryExitNotificationOn, setMeetingEntryExitNotificationOn] = useState(
    chime.meetingEntryExitNotificationOn,
  );
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [VBPopup, setVBPopup] = useState(false);
  const [hasDeviceError, setHasDeviceError] = useState(false);
  const [cloudinaryImgUploadRef, setCloudinaryImgUploadRef] = useState({});
  const [showVisualEffectPopup, setShowVisualEffectPopup] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickedColor, setPickedColor] = useState(null);

  const meetingTimer = (endTime) => {
    const interval = 1000;
    const eventTime = getTimeInLocal(endTime, equivalentTimezone || 'US/Eastern');
    clearTimeout(countDownInterval);
    countDownInterval = setInterval(async () => {
      const days = moment(eventTime).diff(moment(), 'days');
      const hours = moment(eventTime).add(-days, 'days').diff(moment(), 'hours');
      const minute = moment(eventTime).add(-days, 'days').add(-hours, 'hours').diff(moment(), 'minutes');
      const seconds = moment(eventTime)
        .add(-days, 'days')
        .add(-hours, 'hours')
        .add(-minute, 'minutes')
        .diff(moment(), 'seconds');

      setHours(hours <= 0 ? '00' : hours <= 9 ? `0${hours}`.slice(-2) : hours);
      setMinutes(minute <= 0 ? '00' : minute <= 9 ? `0${minute}`.slice(-2) : minute);
      setSeconds(seconds <= 0 ? '00' : seconds <= 9 ? `0${seconds}`.slice(-2) : seconds);
    }, interval);
  };
  useEffect(() => {
    if (meetingTime) {
      meetingTimer(meetingTime);
    }
    return () => {
      if (countDownInterval) {
        clearTimeout(countDownInterval);
        countDownInterval = null;
      }
    };
  }, []);

  const onMettingConfigChange = (item) => {
    const meetingConfig = { ...configData };
    meetingConfig[item] = !meetingConfig[item];
    props.updateChimeConfigDetails(meetingConfig);
  };

  const VBImageUpload = (imageData) => {
    if (imageData?.secureUrl) {
      // chime.setVirtualBackgroundImage(imageData.secureUrl);
      chime.setVirtualBackgroundEffect('Image', imageData.secureUrl, eventId, userId);
    }
  };

  return (
    <div className={cx('custom-control-panel ', 'responsive-controls', { hide: rosterCount === 0 })}>
      <div className="justify-content-space-between d-flex">
        <div className="player-control-first">
          <div className="d-flex flex-md-row">
            {meetingName && (
              <AETooltip isText tooltip={meetingName} placement="left" className="placeholder-content">
                <span id="eventName" className="event-name-badge">
                  {meetingName || ''}
                </span>
              </AETooltip>
            )}

            {meetingTime && (
              <span className="end-timer-badge">
                {hours || '0'}:{minutes || '0'}:{seconds || '00'}
              </span>
            )}
          </div>
        </div>
        <div className="player-control-s-line">{children}</div>
        <div className="player-control-first align-items-ends text-right mobile-dropdown">
          <AEDropDown
            pullRight
            bsSize="sm"
            dropup
            isShowCaret={false}
            maxScrollHeight={'250px'}
            icon="fa fa-ellipsis-v"
            className="font-s14 icon meeting-setting btn"
            id="dropdown-basic"
          >
            <div className="custom-controls-top">
              {chime.isVoiceFocusSupported() && (
                <AEMenuItem
                  eventKey="1"
                  id="deviceNoiceSuppression"
                  onSelect={async () => {
                    await chime.handleVoiceFocusSupported(!isVoiceFocusEnabled);
                    setIsVoiceFocusEnabled(!isVoiceFocusEnabled);
                  }}
                  className={'work-shop-control-color'}
                >
                  {isVoiceFocusEnabled ? (
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-volume" viewBox="0 0 20 18" />
                      <span id="disableNoiseSuppression">{t('deviceSelection:DisableNoiseSuppression')}</span>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-volume-slash" viewBox="0 0 20 18" />
                      <AETooltip
                        tooltip={t('tooltipMsg:Reduce the background noise coming from you')}
                        tooltipProps={{ id: 'tooltipEnableNoise' }}
                        overlayProps={{ placement: 'top' }}
                      >
                        <span id="enableNoiseSuppression">{t('deviceSelection:EnableNoiseSuppression')}</span>
                      </AETooltip>
                    </div>
                  )}
                </AEMenuItem>
              )}
              {chime.isModerator &&
                (chime.isFrom === IsFrom.WORKSHOP ||
                  chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ||
                  chime.isFrom === IsFrom.EXHIBITOR_STUDIO ||
                  chime.isFrom === IsFrom.NETWORKING_LOUNGE) && (
                  <AEMenuItem
                    eventKey="2"
                    className={'work-shop-control-color'}
                    id="deviceMuteAll"
                    onSelect={() => {
                      chime.sendMessage(MessageTopic.GeneralDataMessage, {
                        type: 'MUTEALL',
                      });
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-bar-microphone-mute" viewBox="0 0 26 26" />
                      <span id="muteAll">{t('MuteAll')}</span>
                    </div>
                  </AEMenuItem>
                )}

              {chime.isModerator &&
                (chime.isFrom === IsFrom.WORKSHOP ||
                  chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ||
                  chime.isFrom === IsFrom.EXHIBITOR_STUDIO ||
                  chime.isFrom === IsFrom.NETWORKING_LOUNGE) && (
                  <AEMenuItem
                    className={'work-shop-control-color'}
                    eventKey="3"
                    id="devicestopAllVideo"
                    onSelect={() => {
                      chime.sendMessage(MessageTopic.GeneralDataMessage, {
                        type: 'STOPALLVIDEO',
                      });
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-bar-camera-off" viewBox="0 0 26 26" />
                      <span id="stopAllVideo">{t('StopAllVideo')}</span>
                    </div>
                  </AEMenuItem>
                )}
              {isWorkshopModerator && (
                <AEMenuItem
                  className={'work-shop-control-color'}
                  eventKey="4"
                  id="deviceMuteAttendees"
                  onSelect={() => {
                    chime.sendMessage(MessageTopic.GeneralDataMessage, {
                      type: 'MUTE-ATTENDEES',
                    });
                  }}
                >
                  <div className="d-flex align-items-center">
                    <AEIcons svgIcon="virtual-icon-bar-microphone-mute" viewBox="0 0 26 26" />
                    <span id="muteAttendees">{t('MuteAttendees')}</span>
                  </div>
                </AEMenuItem>
              )}
              {isWorkshopModerator && (
                <AEMenuItem
                  className={'work-shop-control-color'}
                  eventKey="5"
                  id="deviceMuteUnmute"
                  onSelect={() => {
                    onMettingConfigChange('muteAttendeesOnEntry');
                  }}
                >
                  {muteAttendeesOnEntry ? (
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-bar-microphone-mute" viewBox="0 0 26 26" />
                      <span id="unmuteAttendeesOnEntry"> {t('UnmuteAttendeesOnEntry')}</span>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-bar-microphone-unmute" viewBox="0 0 26 26" />
                      <span id="muteAttendeesOnEntry"> {t('MuteAttendeesOnEntry')}</span>
                    </div>
                  )}
                </AEMenuItem>
              )}
              {isWorkshopModerator && (
                <AEMenuItem
                  className={'work-shop-control-color'}
                  eventKey="6"
                  id="deviceEnableDisable"
                  onSelect={() => {
                    onMettingConfigChange('disableAttendeesCameraOnEntry');
                  }}
                >
                  {disableAttendeesCameraOnEntry ? (
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-bar-camera-off" viewBox="0 0 26 26" />
                      <span id="enableAttendeesCameraOnEntry">{t('EnableAttendeesCameraOnEntry')}</span>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-bar-camera-on" viewBox="0 0 26 26" />
                      <span id="disableAttendeesCameraonEntry">{t('DisableAttendeesCameraonEntry')}</span>
                    </div>
                  )}
                </AEMenuItem>
              )}
              <AEMenuItem
                className={'work-shop-control-color'}
                eventKey="7"
                id="deviceEnableDisablemeet"
                onSelect={async () => {
                  await chime.handleMeetingEntryExitNotification(!meetingEntryExitNotificationOn);
                  setMeetingEntryExitNotificationOn(!meetingEntryExitNotificationOn);
                }}
              >
                {meetingEntryExitNotificationOn ? (
                  <div className="d-flex align-items-center">
                    <AEIcons svgIcon="virtual-icon-volume" viewBox="0 0 20 18" />
                    <span id="disableMeetingEntryOrExitSound">
                      {t('deviceSelection:DisableMeetingEntryOrExitSound')}
                    </span>
                  </div>
                ) : (
                  <div className="d-flex align-items-center">
                    <AEIcons svgIcon="virtual-icon-volume-slash" viewBox="0 0 20 18" />
                    <span id="enableMeetingEntryOrExitSound">{t('deviceSelection:EnableMeetingEntryOrExitSound')}</span>
                  </div>
                )}
              </AEMenuItem>
              {(chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ||
                chime.isFrom === IsFrom.WORKSHOP ||
                chime.isFrom === IsFrom.NETWORKING_LOUNGE) && (
                <AEMenuItem
                  eventKey="10"
                  id="devicepipMode"
                  onSelect={handlePipMode}
                  className="mobile-none work-shop-control-color"
                >
                  <div className="d-flex align-items-center">
                    <AEIcons svgIcon="virtual-icon-pip-mode" viewBox="0 0 24 22" />
                    <span id="pipMode">{t('PIP Mode')}</span>
                  </div>
                </AEMenuItem>
              )}
              <AEMenuItem
                eventKey="9"
                id="deviceChangeLayout"
                onSelect={() => {
                  setShowLayoutPopup(true);
                }}
                className="mobile-none work-shop-control-color"
              >
                <div className="d-flex align-items-center">
                  <AEIcons svgIcon="virtual-icon-change-layout" viewBox="0 0 20 16" width={20} />
                  <span id="changeLayout">{t('ChangeLayout')}</span>
                </div>
              </AEMenuItem>
              {(APP_ENV === 'local' || APP_ENV === 'development' || APP_ENV === 'stage') &&
                isWorkshopModerator &&
                chime.isFrom === IsFrom.WORKSHOP && (
                  <AEMenuItem
                    className={'work-shop-control-color'}
                    eventKey="10"
                    id="deviceStartTranscription"
                    onSelect={() => {
                      setShowTranscriptionPopup(true);
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <AEIcons svgIcon="virtual-icon-transcription-settings" viewBox="0 0 24 22" />
                      <span id="startTranscription">{t('common:Transcription Settings')}</span>
                    </div>
                  </AEMenuItem>
                )}
              {(APP_ENV === 'local' || APP_ENV === 'development' || APP_ENV === 'stage') &&
                chime.isFrom === IsFrom.WORKSHOP &&
                (isHideTranscriptionContainer || isHideTranscriptionContainer === undefined ? (
                  <AEMenuItem
                    className={'work-shop-control-color'}
                    eventKey="11"
                    id="deviceShowTranscription"
                    onSelect={() => {
                      if (enableLiveTranscription) props.setChimeTranscription({ isHideTranscriptionContainer: false });
                    }}
                  >
                    <AETooltip
                      tooltip={
                        !enableLiveTranscription
                          ? t('common:Transcription is disabled')
                          : t('common:Transcription is now available')
                      }
                      tooltipProps={{ id: 'tooltipEnableTranscription' }}
                      overlayProps={{ placement: 'left' }}
                    >
                      <div className="d-flex align-items-center">
                        <AEIcons
                          svgIcon="virtual-icon-transcription"
                          viewBox="0 0 22 22"
                          className={`${!enableLiveTranscription ? 'disable_icon' : ''}`}
                          color={!enableLiveTranscription && '#8E909B'}
                        />
                        <span style={{ color: !enableLiveTranscription && '#8E909B' }} id="showTranscription">
                          {t('common:Show Transcription')}
                        </span>
                      </div>
                    </AETooltip>
                  </AEMenuItem>
                ) : (
                  <AEMenuItem
                    className={'work-shop-control-color'}
                    eventKey="12"
                    id="deviceHideTranscription"
                    onSelect={() => {
                      props.setChimeTranscription({ isHideTranscriptionContainer: true });
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <AEIcons
                        svgIcon="virtual-icon-transcription-filled"
                        viewBox="0 0 22 22"
                        className="transcription-icon"
                      />
                      <span id="hideTranscription">{t('common:Hide Transcription')}</span>
                    </div>
                  </AEMenuItem>
                ))}

              {(APP_ENV === 'local' || APP_ENV === 'development') && get(chime, 'currentVideoInputDevice.value') && (
                <AEMenuItem
                  className={'work-shop-control-color'}
                  eventKey="14"
                  id="effectPopup"
                  onClick={async () => {
                    const localTileState = chime.audioVideo.getLocalVideoTile();
                    if (
                      chime.audioVideo.hasStartedLocalVideoTile() &&
                      localTileState?.tileState?.active &&
                      localTileState?.tileState?.localTileStarted
                    ) {
                      setVBPopup(false);
                      setShowVisualEffectPopup(true);
                    } else {
                      const videoInputResp =
                        chime.meetingReadinessChecker &&
                        (await chime.meetingReadinessChecker.checkVideoInput(chime.currentVideoInputDevice.value));
                      if (videoInputResp === 0) {
                        setVBPopup(true);
                        setShowVisualEffectPopup(true);
                      } else {
                        setHasDeviceError(true);
                      }
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    <AEIcons svgIcon="apply_effect_icon" viewBox="0 0 24 24" />
                    <span id="changeBackground">{t('ApplyBackgroundEffect')}</span>
                  </div>
                </AEMenuItem>
              )}
            </div>
            <div className="divider chime_dropdown_divider" />
            <AEMenuItem
              className={'work-shop-control-color'}
              eventKey="8"
              id="deviceSettings"
              onClick={async () => {
                setShowSetting(true);
              }}
            >
              <div className="d-flex align-items-center">
                <AEIcons svgIcon="virtual-icon-settings-gear" viewBox="0 0 18 16" />
                <span id="setting"> {t('common:Settings')}</span>
              </div>
            </AEMenuItem>
          </AEDropDown>
        </div>
      </div>
      <AEPopup
        id="showSettingPopup"
        showModal={showSetting}
        onCloseFunc={() => setShowSetting(false)}
        headerText={<p className="m-0">{t('common:Settings')}</p>}
        bsSize="large"
        headerClass="m-b-15"
        custClassName="modal-device-settings"
      >
        <DeviceSetting />
      </AEPopup>

      <AEPopup
        id="deviceError"
        showModal={hasDeviceError}
        onCloseFunc={() => setHasDeviceError(false)}
        headerText={<p className="m-0">{t('Confirm')}</p>}
        headerClass="m-b-30"
        bsSize="md"
        modelFooter={
          <AEButton variant="danger" size="small" onClick={() => setHasDeviceError(false)}>
            {t('common:Close')}
          </AEButton>
        }
      >
        <p className="text-center">{t('chime:Device Unavailable')}</p>
      </AEPopup>

      <AEPopup
        id="showSettingPopup"
        showModal={showLayoutPopup}
        onCloseFunc={() => setShowLayoutPopup(false)}
        headerText={<p className="text-left m-b-0">{t('ChangeLayout')}</p>}
        custClassName="modal-device-settings"
        bsSize="sm"
        headerClass="m-b-30"
      >
        <LayoutOptions
          viewMode={viewMode}
          onLayoutChange={(mode) => {
            chime.unpinAllAttendee();
            onLayoutChange && onLayoutChange(mode);
          }}
        />
      </AEPopup>
      <AEPopup
        id="showSettingPopup"
        showModal={showTranscriptionPopup}
        onCloseFunc={() => setShowTranscriptionPopup(false)}
        headerText={<p className="transcription-modal-header">{t('common:Transcription')}</p>}
        bsSize="md"
        headerClass="m-b-15"
        custClassName="modal-device-settings"
        type="style2"
      >
        <LiveTranscriptionModal
          setShowTranscriptionPopup={(val) => setShowTranscriptionPopup(val)}
          showMessage={showMessage}
        />
      </AEPopup>

      <AEPopup
        id="showVisualEffect"
        showModal={showVisualEffectPopup}
        onCloseFunc={() => setShowVisualEffectPopup(false)}
        headerText={
          <p className="text-left">
            {t('Effects')} {VBPopup && <div className="help-text error-field">{t('CameraAlertForEffect')}</div>}
          </p>
        }
        custClassName="modal-device-settings"
        bsSize="sm"
      >
        <span className="help-text">{t(`NoBackroundEffect`)}</span>
        <div className="d-flex mt-2 mb-3">
          <AEButton
            variant="secondary"
            size="medium"
            className="mr-2"
            onClick={() => {
              chime.removeBackground();
            }}
          >
            <AEIcons svgIcon="effect_ban_icon" viewBox="0 0 24 24" />
          </AEButton>
          <AEButton
            variant="secondary"
            size="medium"
            className="mr-2"
            onClick={() => {
              chime.blurBackground(5, eventId, userId);
            }}
          >
            <AEIcons svgIcon="effect_slight_blur_icon" viewBox="0 0 24 24" />
          </AEButton>
          <AEButton
            variant="secondary"
            size="medium"
            className="mr-2"
            onClick={() => {
              chime.blurBackground(10, eventId, userId);
            }}
          >
            <AEIcons svgIcon="effect_blur_icon" viewBox="0 0 24 24" />
          </AEButton>
          <AEButton
            variant="secondary"
            size="medium"
            onClick={() => {
              setShowColorPicker(true);
            }}
          >
            <AEIcons svgIcon="color_picker" viewBox="0 0 24 24" />
          </AEButton>
        </div>
        <span className="help-text">{t(`Backgrounds`)}</span>
        <div className="d-flex mt-2 mb-5">
          <AEButton
            variant="secondary"
            size="medium"
            onClick={() => {
              cloudinaryImgUploadRef.open();
            }}
          >
            <AEIcons svgIcon="effect_image_icon" viewBox="0 0 24 24" />
          </AEButton>
        </div>
      </AEPopup>

      <AEPopup
        id="colorPickerModal"
        showModal={showColorPicker}
        onCloseFunc={() => setShowColorPicker(false)}
        headerText={<p className="text-left">{'Color Picker'}</p>}
        bsSize="sm"
        custClassName="modal-device-settings"
      >
        <SketchPicker
          onChangeComplete={(color) => {
            chime.setBackgroundColor(color.hex);
            setPickedColor(color.hex);
          }}
          color={pickedColor || '#ffffff'}
          className="mx-auto"
        />
      </AEPopup>

      <AEImageUploader
        id="VBImageUpload"
        onReff={(ref) => setCloudinaryImgUploadRef(ref)}
        popupHeader="Upload Virtual Background Image"
        imageUploaded={VBImageUpload}
        instructions="The minimal image dimensions are 512 x 512 pixels"
        uploadType="virtualBackground"
        minImageWidth={512}
        minImageHeight={512}
      />
    </div>
  );
}

const mapDispatchToProps = {
  setChimeTranscription,
};
const mapStateToProps = (state) => ({
  transcription: selectorChimeTranscription(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(CustomControls);
