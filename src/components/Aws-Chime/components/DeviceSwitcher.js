import React, { useState, useContext, useEffect } from 'react';
import size from 'lodash/size';
import { useTranslation } from 'react-i18next';
import AETooltip from '../../../Core/Tooltip';
import useDevices from '../hooks/useDevices';
import getChimeContext from '../context/getChimeContext';
import AEButton from '../../../Core/Button/Button';
import AELabel from '../../../Core/Label/label';
import { AEDropDown, AEMenuItem } from '../../../Core/Dropdown';
import AESelect from '../../../Core/Select/Select';
import { getLocalStorage } from '../../Widget/Utility/Utility';

export default function DeviceSwitcher(props) {
  const chime = useContext(getChimeContext());
  const deviceSwitcherState = useDevices();
  const audioInputDevices = deviceSwitcherState.audioInputDevices;
  const audioOutputDevices = deviceSwitcherState.audioOutputDevices;
  const videoInputDevices = deviceSwitcherState.videoInputDevices;
  const [isVoiceFocusEnabled, setIsVoiceFocusEnabled] = useState(false);
  const [meetingEntryExitNotificationOn, setMeetingEntryExitNotificationOn] = useState(
    chime.meetingEntryExitNotificationOn,
  );
  const [currentAudioInputDevice, setCurrentAudioInputDevice] = useState(chime.currentAudioInputDevice || {});
  const [currentAudioOutputDevice, setCurrentAudioOutputDevice] = useState(chime.currentAudioOutputDevice || {});
  const [currentVideoInputDevice, setCurrentVideoInputDevice] = useState(chime.currentVideoInputDevice || {});

  const [dropDownOpen, setDropDownOpen] = useState(false);

  const { t } = useTranslation(['deviceSelection', 'tooltipMsg']);
  const isAudioOutputAvailabel = chime.isAudioOuputSpeakerAvailabel();

  const deviceSwitcher = () => {
    const chimeDevices = getLocalStorage('chimeDevices') || {};
    if (audioInputDevices && audioInputDevices.length > 0) {
      setCurrentAudioInputDevice(
        chimeDevices && chimeDevices.currentAudioInputDevice
          ? chimeDevices.currentAudioInputDevice
          : deviceSwitcherState.currentAudioInputDevice,
      );
    }
    if (audioOutputDevices && audioOutputDevices.length > 0) {
      setCurrentAudioOutputDevice(
        chimeDevices && chimeDevices.currentAudioOutputDevice
          ? chimeDevices.currentAudioOutputDevice
          : deviceSwitcherState.currentAudioOutputDevice,
      );
    }
    if (videoInputDevices && videoInputDevices.length > 0) {
      setCurrentVideoInputDevice(
        chimeDevices && chimeDevices.currentVideoInputDevice
          ? chimeDevices.currentVideoInputDevice
          : deviceSwitcherState.currentVideoInputDevice,
      );
    }
  };

  useEffect(() => {
    deviceSwitcher();
  }, []);

  useEffect(() => {
    props.showChimeSideBar ? setDropDownOpen(false) : null;
  }, [props.showChimeSideBar]);

  const handleMicrophoneJson = () => {
    let data = [];
    if (audioInputDevices && audioInputDevices.length === 0) {
      data = [{ value: '', label: t('AudioInputNotFound'), key: '' }];
    }
    if (audioInputDevices) {
      data = audioInputDevices.map((value, index) => ({
        key: index,
        value: value.value,
        label: value.label || 'Default',
      }));
    }
    return data;
  };

  const handleOutputJson = () => {
    let data = [];
    if (audioOutputDevices && audioOutputDevices.length === 0) {
      data = [{ value: '', label: t('AudioOutputNotFound') }];
    } else {
      data = audioOutputDevices.map((value, index) => ({
        key: index,
        value: value.value,
        label: value.label || 'Default',
      }));
    }
    return data;
  };
  const handleCameraJson = () => {
    let data = [];
    if (size(videoInputDevices)) {
      data = videoInputDevices.map((value, index) => ({
        key: index,
        value: value.value,
        label: value.label || 'Default',
      }));
    }
    if (videoInputDevices && videoInputDevices.length === 0) {
      data = [{ value: '', label: t('VideoInputNotFound') }];
    }
    return data;
  };
  const dropDownToggle = () => {
    setDropDownOpen(!dropDownOpen);
  };

  const toggleSettingSidebar = () => {
    props.toggleSettingsSideBar(false);
    setDropDownOpen(false);
  };

  useEffect(() => setCurrentAudioInputDevice(chime.currentAudioInputDevice), [chime.currentAudioInputDevice]);
  useEffect(() => setCurrentAudioOutputDevice(chime.currentAudioOutputDevice), [chime.currentAudioOutputDevice]);
  useEffect(() => setCurrentVideoInputDevice(chime.currentVideoInputDevice), [chime.currentVideoInputDevice]);

  return (
    <div>
      <div className="d-flex justify-content-between device-switcher-header p-10">
        <div className="ae-label">
          <div className="label-block">
            <h3 className="ae-captions text-white-color device-switcher-text m-0">{t('DeviceSwitcher')}</h3>
          </div>
        </div>
        <div className="pull-right d-flex">
          <AEDropDown
            pullRight
            bsSize="sm"
            isShowCaret={false}
            onClick={dropDownToggle}
            open={dropDownOpen}
            className="font-s14 icon ac-icon-settings custom_dropdown m-r-10 btn-small hover_focus_effect_1"
            id="dropdown-basic"
            aria-label="Device Switcher Settings"
            tabIndex="0"
          >
            {chime.isVoiceFocusSupported() && (
              <span
                tabIndex="0"
                role="menuitem"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await chime.handleVoiceFocusSupported(!isVoiceFocusEnabled);
                    setIsVoiceFocusEnabled(!isVoiceFocusEnabled);
                  }
                }}
              >
                <AEMenuItem
                  eventKey="1"
                  className="device-switcher-language"
                  onSelect={async () => {
                    await chime.handleVoiceFocusSupported(!isVoiceFocusEnabled);
                    setIsVoiceFocusEnabled(!isVoiceFocusEnabled);
                  }}
                >
                  {isVoiceFocusEnabled ? (
                    t('deviceSelection:DisableNoiseSuppression')
                  ) : (
                    <AETooltip
                      tooltip={t('tooltipMsg:Reduce the background noise coming from you')}
                      tooltipProps={{ id: 'tooltipEnableNoise' }}
                      overlayProps={{ placement: 'top' }}
                    >
                      {t('deviceSelection:EnableNoiseSuppression')}
                    </AETooltip>
                  )}
                </AEMenuItem>
              </span>
            )}
            <AEMenuItem
              eventKey="4"
              className="device-switcher-language"
              onSelect={async () => {
                await chime.handleMeetingEntryExitNotification(!meetingEntryExitNotificationOn);
                setMeetingEntryExitNotificationOn(!meetingEntryExitNotificationOn);
              }}
            >
              {meetingEntryExitNotificationOn
                ? t('deviceSelection:DisableMeetingEntryOrExitSound')
                : t('deviceSelection:EnableMeetingEntryOrExitSound')}
            </AEMenuItem>
          </AEDropDown>
          <AEButton
            className="pull-right deviceSwitchBtn hover_focus_effect_1"
            variant="secondary"
            onClick={toggleSettingSidebar}
            onKeyDown={(e) => {
              e.key === 'Enter' && props.toggleSettingsSideBar(false);
              setTimeout(() => {
                document.querySelector('#open_device_settings')?.focus();
              }, 500);
            }}
            aria-label="Close Device switcher settings"
            icon="fa fa-times-circle deviceSwitchIcon m-0"
          />
        </div>
      </div>
      <hr className="m-t-0 m-b-10" />
      <div className="deviceList">
        <div>
          <AELabel htmlFor="select_input" id="select_input_label" subHeader={t('Input')} />
          <AESelect
            onChange={async (selectedDevice) => {
              const filteredDevice = audioInputDevices.filter((obj) => obj.value === selectedDevice.value);
              setCurrentAudioInputDevice(filteredDevice[0]);
              await chime.chooseAudioInputDevice(filteredDevice[0]);
            }}
            id="select_input"
            name="select_input"
            value={(currentAudioInputDevice && currentAudioInputDevice.value) || ''}
            disabled={!audioInputDevices || !audioInputDevices.length}
            options={handleMicrophoneJson()}
            aria-label="Input"
          />
        </div>
        {isAudioOutputAvailabel && (
          <div>
            <AELabel htmlFor="select_output" id="select_output_label" subHeader={t('Output')} className="m-t-10" />
            <AESelect
              onChange={async (selectedDevice) => {
                const filteredDevice = audioOutputDevices.filter((obj) => obj.value === selectedDevice.value);
                setCurrentAudioOutputDevice(filteredDevice[0]);
                await chime.chooseAudioOutputDevice(filteredDevice[0]);
              }}
              id="select_output"
              name="select_output"
              value={(currentAudioOutputDevice && currentAudioOutputDevice.value) || ''}
              disabled={!audioOutputDevices || !audioOutputDevices.length}
              options={handleOutputJson()}
              aria-label="Output"
            />
          </div>
        )}
        <div>
          <AELabel htmlFor="select_camera" id="select_camera_label" subHeader={t('Camera')} className="m-t-10" />
          <AESelect
            onChange={async (selectedDevice) => {
              const filteredDevice = videoInputDevices.filter((obj) => obj.value === selectedDevice.value);
              setCurrentVideoInputDevice(filteredDevice[0]);
              await chime.chooseVideoInputDevice(filteredDevice[0]);
            }}
            id="select_camera"
            name="select_camera"
            value={(currentVideoInputDevice && currentVideoInputDevice.value) || ''}
            disabled={!videoInputDevices || !videoInputDevices.length}
            options={handleCameraJson()}
            aria-label="Camera"
          />
        </div>
      </div>
    </div>
  );
}
