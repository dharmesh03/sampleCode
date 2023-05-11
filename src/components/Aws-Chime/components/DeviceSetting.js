import React, { useState, useEffect, useContext } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { TabContainer, TabContent, TabPane, Nav, NavItem } from 'react-bootstrap';
import useDevices from '../hooks/useDevices';
import getChimeContext from '../context/getChimeContext';
import AEIcons from '../../../Core/Icon/index';
import AEToggleSwitch from '../../../Core/ToggleSwitch/ToggleSwitch';
import LocalVideoPreview from './LocalVideoPreview';
import AESelect from '../../../Core/Select/Select';

export default function DeviceSetting() {
  const chime = useContext(getChimeContext());
  const { t } = useTranslation(['deviceSelection', 'common']);
  const deviceSwitcherState = useDevices();
  const audioInputDevices = deviceSwitcherState.audioInputDevices;
  const audioOutputDevices = deviceSwitcherState.audioOutputDevices;
  const videoInputDevices = deviceSwitcherState.videoInputDevices;
  const [currentAudioInputDevice, setCurrentAudioInputDevice] = useState(
    deviceSwitcherState.currentAudioInputDevice || {},
  );
  const [currentAudioOutputDevice, setCurrentAudioOutputDevice] = useState(
    deviceSwitcherState.currentAudioOutputDevice || {},
  );
  const [currentVideoInputDevice, setCurrentVideoInputDevice] = useState(
    deviceSwitcherState.currentVideoInputDevice || {},
  );
  const [loadding, setLoadding] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [enableCamera, setEnableCamera] = useState(false);
  const isAudioOutputAvailabel = chime.isAudioOuputSpeakerAvailabel();

  const setAudioPreviewPercent = (percent) => {
    const audioPreview = document.getElementById('audio-preview');
    if (audioPreview) {
      if (audioPreview.getAttribute('aria-valuenow') !== `${percent}`) {
        audioPreview.style.width = `${percent}%`;
        audioPreview.setAttribute('aria-valuenow', `${percent}`);
      }
      const transitionDuration = '33ms';
      if (audioPreview.style.transitionDuration !== transitionDuration) {
        audioPreview.style.transitionDuration = transitionDuration;
      }
    }
  };

  const audioInputPreview = async () => {
    setAudioPreviewPercent(0);

    if (chime.analyserNode) {
      chime.analyserNode.disconnect();
      chime.analyserNode.removeOriginalInputs();
      chime.analyserNode = undefined;
    }

    const analyserNode = chime?.audioVideo?.createAnalyserNodeForAudioInput();
    if (!analyserNode) {
      return;
    }

    chime.analyserNode = analyserNode;

    const data = new Uint8Array(analyserNode.fftSize);
    let frameIndex = 0;
    chime.analyserNodeCallback = () => {
      if (frameIndex === 0) {
        analyserNode.getByteTimeDomainData(data);
        const lowest = 0.01;
        let max = lowest;
        for (const f of data) {
          max = Math.max(max, (f - 128) / 128);
        }
        const normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
        const percent = Math.min(Math.max(normalized * 100, 0), 100);
        setAudioPreviewPercent(percent); // update preview to percentage
      }
      frameIndex = (frameIndex + 1) % 2;
      requestAnimationFrame(chime.analyserNodeCallback);
    };
    requestAnimationFrame(chime.analyserNodeCallback);
  };

  const deviceSelection = async () => {
    setCurrentAudioInputDevice(chime.currentAudioInputDevice);
    setCurrentAudioOutputDevice(chime.currentAudioOutputDevice);
    setCurrentVideoInputDevice(chime.currentVideoInputDevice);
    audioInputPreview();
  };

  const handleCameraChange = async (selectedDevice) => {
    setLoadding(true);
    const device = selectedDevice?.value;
    const filteredDevice = videoInputDevices.filter((obj) => obj.value === device);
    setCurrentVideoInputDevice(filteredDevice[0]);
    await chime.chooseVideoInputDevice(filteredDevice[0]);
    setLoadding(false);
  };

  const handleMicrophoneChange = async (selectedDevice) => {
    const device = selectedDevice?.value;
    const filteredDevice = audioInputDevices.filter((obj) => obj.value === device);
    setCurrentAudioInputDevice(filteredDevice[0]);
    await chime.chooseAudioInputDevice(filteredDevice[0]);
    audioInputPreview();
  };

  const handleSpeakerChange = async (selectedDevice) => {
    const device = selectedDevice?.value;
    const filteredDevice = audioOutputDevices.filter((obj) => obj.value === device);
    setCurrentAudioOutputDevice(filteredDevice[0]);
    await chime.chooseAudioOutputDevice(filteredDevice[0]);
  };

  const handleVideoQualityChange = async (event) => {
    await chime.changeVideoQuality(event.value);
  };

  const getMicrophoneDevices = () => {
    let data = [];
    if (audioInputDevices && audioInputDevices.length === 0) {
      data = [{ value: '', label: t('AudioInputNotFound'), key: '' }];
    } else {
      data = audioInputDevices.map((value, index) => ({
        key: index,
        value: value.value,
        label: value.label || 'Default',
      }));
    }
    return data;
  };

  const getCameraDevices = () => {
    let data = [];
    if (videoInputDevices && videoInputDevices.length === 0) {
      data = [{ value: '', label: t('VideoInputNotFound') }];
    } else {
      data = videoInputDevices.map((value, index) => ({
        key: index,
        value: value.value,
        label: value.label || 'Default',
      }));
    }
    return data;
  };

  const getSpeakerDevices = () => {
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

  const getVideoQualityList = () => {
    let data = [];
    if (videoInputDevices && videoInputDevices.length === 0) {
      data = [{ value: '', label: t('VideoInputNotFound') }];
    } else {
      data = chime.availableVideoQualities;
    }
    return data;
  };

  useEffect(() => {
    if (!chime.audioVideo) return;
    setEnableCamera(chime.audioVideo.hasStartedLocalVideoTile());
    deviceSelection();
  }, [chime.audioVideo]);

  const toggleCamera = async () => {
    if (!enableCamera) {
      chime.audioVideo && (await chime.audioVideo.startLocalVideoTile());
    } else {
      chime.audioVideo && (await chime.audioVideo.stopLocalVideoTile());
    }
    setEnableCamera(!enableCamera);
  };

  useEffect(() => setCurrentAudioInputDevice(deviceSwitcherState.currentAudioInputDevice), [
    deviceSwitcherState.currentAudioInputDevice,
  ]);
  useEffect(() => setCurrentAudioOutputDevice(deviceSwitcherState.currentAudioOutputDevice), [
    deviceSwitcherState.currentAudioOutputDevice,
  ]);
  useEffect(() => setCurrentVideoInputDevice(deviceSwitcherState.currentVideoInputDevice), [
    deviceSwitcherState.currentVideoInputDevice,
  ]);

  return (
    <div className="deviceList">
      <div id="flow-devices" className="flow device-tab-border--top ">
        <TabContainer>
          <div>
            <div className="col-md-3 p-l-0 device-selection-tabs m-t-10">
              <Nav variant="pills" className="flex-column">
                <NavItem onClick={() => setActiveTab(1)} className={cx('m-1', activeTab === 1 && 'active-link')}>
                  <div className="vertical-tab--label">
                    <AEIcons className="virtual-icon-talks pr-1 " id="audioIcon" />
                    <span id="audioSetting">{t('Audio')}</span>
                  </div>
                </NavItem>
                <NavItem onClick={() => setActiveTab(2)} className={cx('m-1', activeTab === 2 && 'active-link')}>
                  <div className="vertical-tab--label ">
                    <AEIcons className="virtual-icon-stage-outlined pr-1 " id="videoIcon" />
                    <span id="videoSetting">{t('Video')}</span>
                  </div>
                </NavItem>
              </Nav>
            </div>
            <div className="col-md-9 p-r-0 device-tab-border--left tab-content-padding">
              <TabContent className="device-settings m-t-10">
                <form id="form-devices">
                  {activeTab === 1 && (
                    <TabPane className={'active in'} eventKey={1}>
                      <div className="mt-3">
                        <div className="col-12 col-sm-8 p-l-0">
                          <label htmlFor="microphone" id="microphone_label">
                            {t('Microphone')}
                          </label>
                          <AESelect
                            onChange={handleMicrophoneChange}
                            id="microphone"
                            name="microphone"
                            value={(currentAudioInputDevice && currentAudioInputDevice.value) || ''}
                            disabled={!audioInputDevices || !audioInputDevices.length}
                            options={getMicrophoneDevices()}
                            aria-label="Select Microphone"
                            downArrow="microphneDownArrow"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            closeMenuOnScroll
                          />
                        </div>
                        <div className="text-center col-sm-4 d-sm-block p-0">
                          <label htmlFor="audio-preview" id="audio-preview_label">
                            {t('common:Preview')}
                          </label>
                          <div className="w-100 progress m-t-10">
                            <div
                              id="audio-preview"
                              className="progress-bar bg-success"
                              role="progressbar"
                              aria-valuenow="0"
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                        </div>
                      </div>
                      {isAudioOutputAvailabel && (
                        <div className="mt-3">
                          <div className="col-12 col-sm-8 p-l-0">
                            <label htmlFor="speaker" id="speaker_label">
                              {t('Speakers')}
                            </label>
                            <AESelect
                              onChange={handleSpeakerChange}
                              id="speaker"
                              name="speaker"
                              value={(currentAudioOutputDevice && currentAudioOutputDevice.value) || ''}
                              disabled={!audioOutputDevices || !audioOutputDevices.length}
                              options={getSpeakerDevices()}
                              aria-label="Select Speaker"
                              downArrow="spekrDownArrow"
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
                              closeMenuOnScroll
                            />
                          </div>
                        </div>
                      )}
                    </TabPane>
                  )}
                  {activeTab === 2 && (
                    <TabPane className={'active in'} eventKey={2}>
                      <div className="mt-3 clearfix">
                        <div className="col-12 col-sm-8 p-0 d-flex align-items-center">
                          <label htmlFor="video-input block" className="mr-1 d-block">
                            {`${t('Enable')} ${t('Video')}`}
                          </label>
                          <AEToggleSwitch
                            name="cameraOff"
                            id="cameraOff"
                            defaultValue={enableCamera}
                            className="success"
                            onClick={toggleCamera}
                          />
                        </div>

                        <div className="col-sm-4 text-center d-sm-block video-preview device-selection--preview-container p-0">
                          {!loadding && !chime.iOS() ? (
                            <LocalVideoPreview className="w-100 h-100 preview-box device-selection--preview" />
                          ) : (
                            <div className="text-center">
                              <span className="fa fa-spinner fa-3x mrg-t-lg fa-pulse fa-fw" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 clearfix">
                        <div>
                          <label htmlFor="camera" id="camera_label">
                            {t('Camera')}
                          </label>
                          <AESelect
                            onChange={handleCameraChange}
                            id="camera"
                            name="camera"
                            value={(currentVideoInputDevice && currentVideoInputDevice.value) || ''}
                            disabled={!videoInputDevices || !videoInputDevices.length}
                            options={getCameraDevices()}
                            aria-label="Select Camera"
                            downArrow="camraDownArrow"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            closeMenuOnScroll
                          />
                        </div>
                      </div>
                      <div className="mt-3 clearfix">
                        <div>
                          <label htmlFor="video-quality" id="video-quality_label">
                            {t('VideoQuality')}
                          </label>
                          <AESelect
                            onChange={handleVideoQualityChange}
                            id="video-quality"
                            name="video-quality"
                            value={chime.currentVideoQuality}
                            disabled={!videoInputDevices || !videoInputDevices.length}
                            options={getVideoQualityList()}
                            aria-label="Select Video Quality"
                            downArrow="qualityDownArrow"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            closeMenuOnScroll
                          />
                        </div>
                      </div>
                    </TabPane>
                  )}
                </form>
              </TabContent>
            </div>
          </div>
        </TabContainer>
      </div>
    </div>
  );
}
