import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  CheckVideoInputFeedback,
  CheckAudioInputFeedback,
  CheckAudioOutputFeedback,
  IntervalScheduler,
} from 'amazon-chime-sdk-js';
import cx from 'classnames';
import get from 'lodash/get';
import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import useDevices from '../hooks/useDevices';
import getChimeContext from '../context/getChimeContext';
import DefaultMeetingReadinessChecker from './DefaultMeetingReadinessChecker';
import AEButton from '../../../Core/Button/Button';
import AESpinner from '../../../Core/Spinner/Spinner';
import AESelect from '../../../Core/Select/Select';
import AELabel from '../../../Core/Label/label';
import AECheckbox from '../../../Core/Checkbox/Checkbox';
import AEIcons from '../../../Core/Icon/index';
import AERadioButton from '../../../Core/RadioButton/RadioButton';
import { Status } from '../enums/MeetingConstant';
import AEPopup from '../../../Core/Popup';

let canHear = null;
function DeviceSelection(props) {
  const { eventUrl } = props;
  const chime = useContext(getChimeContext());
  const deviceSwitcherState = useDevices();
  const videoPreviewElement = useRef(null);
  const audioInputDevices = deviceSwitcherState.audioInputDevices;
  const audioOutputDevices = deviceSwitcherState.audioOutputDevices;
  const videoInputDevices = deviceSwitcherState.videoInputDevices;
  const [currentAudioInputDevice, setCurrentAudioInputDevice] = useState(chime.currentAudioInputDevice || {});
  const [currentAudioOutputDevice, setCurrentAudioOutputDevice] = useState(chime.currentAudioOutputDevice || {});
  const [currentVideoInputDevice, setCurrentVideoInputDevice] = useState(chime.currentVideoInputDevice || {});
  const [showChimeMeetingReadinessChecker, setShowChimeMeetingReadinessChecker] = useState(false);
  const [audioStatus, setAudioStatus] = useState();
  const [videoStatus, setVideoStatus] = useState();
  const [videoPreviewStatus, setVideoPreviewStatus] = useState('Loading');
  const [audioPreviewStatus, setAudioPreviewStatus] = useState('Disabled');
  const [showSpeakerPreviewStatus, setShowSpeakerPreviewStatus] = useState('');
  const [isSpeakerWorking, setIsSpeakerWorking] = useState('');
  const audioElement = useRef(null);
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });

  const { t } = useTranslation(['deviceSelection', 'common']);
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

  const stopAudioPreview = async () => {
    if (!chime.analyserNode) {
      return;
    }
    chime.analyserNodeCallback = undefined;
    chime.analyserNode.disconnect();
    chime.analyserNode.removeOriginalInputs();
    chime.analyserNode = undefined;
  };

  const startAudioPreview = () => {
    setAudioPreviewPercent(0);

    if (chime.analyserNode) {
      chime.analyserNode.disconnect();
      chime.analyserNode.removeOriginalInputs();
      chime.analyserNode = undefined;
    }

    const analyserNode = chime.audioVideo.createAnalyserNodeForAudioInput();
    if (!analyserNode) {
      return;
    }

    if (!analyserNode.getByteTimeDomainData) {
      document.getElementById('audio-preview').parentElement.style.visibility = 'hidden';
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
        setAudioPreviewPercent(percent);
      }
      frameIndex = (frameIndex + 1) % 2;
      if (chime.analyserNodeCallback) {
        requestAnimationFrame(chime.analyserNodeCallback);
      }
    };
    requestAnimationFrame(chime.analyserNodeCallback);
  };

  const audioInputPreview = async (device) => {
    const status = chime.meetingReadinessChecker && (await chime.meetingReadinessChecker.checkAudioInput(device));
    setAudioStatus(status);
    chime.isMicrophoneAccessible = status === 0;
    if (chime.isMicrophoneAccessible) {
      await chime.chooseAudioInputDevice(device);
      startAudioPreview();
      setAudioPreviewStatus('Enabled');
    } else {
      setAudioPreviewStatus('Disabled');
    }
  };

  const videoInputPreview = async (device) => {
    const status = chime.meetingReadinessChecker && (await chime.meetingReadinessChecker.checkVideoInput(device));
    setVideoStatus(status);
    chime.isCameraAccessible = status === 0;
    if (chime.isCameraAccessible) {
      await chime.chooseVideoInputDevice(device);
      videoPreviewElement.current &&
        (await chime.audioVideo.startVideoPreviewForVideoInput(videoPreviewElement.current));
      setVideoPreviewStatus('Enabled');
    } else {
      setVideoPreviewStatus('Disabled');
    }
  };

  const handleSpeakerVoiceOption = (e) => {
    const { value } = e.target;
    canHear = value === 'YES';
    setIsSpeakerWorking(value);
    setTimeout(() => {}, 500);
  };

  const audioTest = async () => {
    if (!currentAudioOutputDevice) {
      return;
    }
    setShowSpeakerPreviewStatus('INITIATED');
    setIsSpeakerWorking('');
    canHear = null;
    const audioElement = document.getElementById('speaker-test-audio-element');
    const audioOutputResp =
      chime.meetingReadinessChecker &&
      (await chime.meetingReadinessChecker.checkAudioOutput(
        currentAudioOutputDevice.value,
        () =>
          new Promise((resolve) => {
            const scheduler = new IntervalScheduler(1000);
            scheduler.start(() => {
              if (canHear !== null) {
                scheduler.stop();
                resolve(canHear);
              }
            });
          }),
        audioElement,
      ));

    const textToDisplay = CheckAudioOutputFeedback[audioOutputResp];
    setShowSpeakerPreviewStatus(textToDisplay);
  };

  const deviceSelection = async () => {
    setCurrentAudioInputDevice(chime.currentAudioInputDevice);
    setCurrentAudioOutputDevice(chime.currentAudioOutputDevice);
    setCurrentVideoInputDevice(chime.currentVideoInputDevice);
    await videoInputPreview(chime.currentVideoInputDevice);
    await audioInputPreview(chime.currentAudioInputDevice);
  };

  const handleLocalVideoTiles = async () => {
    try {
      if (videoPreviewStatus === 'Enabled') {
        setVideoPreviewStatus('Disabled');
        await chime.audioVideo.stopVideoPreviewForVideoInput(document.getElementById('video-preview'));
        await chime.audioVideo?.stopVideoInput();
        setCurrentVideoInputDevice(null);
      } else if (deviceSwitcherState.currentVideoInputDevice) {
        setVideoPreviewStatus('Loading');
        await chime.chooseVideoInputDevice(deviceSwitcherState.currentVideoInputDevice);
        videoInputPreview();
      }
    } catch (error) {
      console.error(error);
      setVideoPreviewStatus('Disabled');
    }
  };

  const handleLocalAudio = async () => {
    setAudioPreviewStatus('Loading');
    try {
      if (audioPreviewStatus === 'Enabled') {
        setAudioPreviewStatus('Disabled');
        chime.audioVideo && chime.audioVideo.realtimeMuteLocalAudio();
        setCurrentAudioInputDevice(null);
      } else if (deviceSwitcherState.currentAudioInputDevice) {
        setAudioPreviewStatus('Loading');
        chime.audioVideo && chime.audioVideo.realtimeUnmuteLocalAudio();
        audioInputPreview();
      }
    } catch (error) {
      console.error(error);
      setAudioPreviewStatus('Disabled');
    }
  };

  const handleCameraChange = async (selectedDevice) => {
    setVideoPreviewStatus('Loading');
    const device = get(selectedDevice, 'value', 'OFF');
    if (device === 'OFF') {
      setCurrentVideoInputDevice({ value: 'OFF' });
      if (chime.audioVideo) {
        await chime.audioVideo.stopVideoPreviewForVideoInput(videoPreviewElement.current);
        await chime.audioVideo.stopVideoInput();
      }
    } else {
      const filteredDevice = videoInputDevices.filter((obj) => obj.value === device);
      setCurrentVideoInputDevice(filteredDevice[0]);
      if (chime.audioVideo) {
        await chime.audioVideo.stopVideoPreviewForVideoInput(videoPreviewElement.current);
        await chime.audioVideo.stopVideoInput();
      }
      await videoInputPreview(filteredDevice[0]);
    }
  };

  const readinessCheckerDone = async () => {
    await chime.audioVideo.stopVideoPreviewForVideoInput(videoPreviewElement.current);
    await chime.audioVideo?.stopVideoInput();
    await deviceSelection();
    setShowChimeMeetingReadinessChecker(false);
  };

  const renderDeviceStatus = (audioStatus, videoStatus) => {
    let status;
    let message = '';
    if (audioStatus === CheckAudioInputFeedback.Succeeded && videoStatus === CheckVideoInputFeedback.Succeeded) {
      status = null;
      message = '';
    } else if (
      audioStatus === CheckAudioInputFeedback.PermissionDenied &&
      videoStatus === CheckVideoInputFeedback.PermissionDenied
    ) {
      status = 'Camera and microphone are blocked. Please check device permissions.';
      message = 'CameraAndMicrophoneBlocked';
    } else if (audioStatus === CheckAudioInputFeedback.Failed && videoStatus === CheckVideoInputFeedback.Failed) {
      status = 'Failed to connect with camera and microphone.';
      message = 'FailedToConnectCameraAndMicrophone';
    } else if (audioStatus === CheckAudioInputFeedback.Succeeded) {
      if (videoStatus === CheckVideoInputFeedback.Failed) {
        status = 'Failed to connect with camera.';
        message = 'FailedToConnectCamera';
      } else if (videoStatus === CheckVideoInputFeedback.PermissionDenied) {
        status = 'Camera is blocked. Please check device permission.';
        message = 'CameraIsBlocked';
      }
    } else if (videoStatus === CheckVideoInputFeedback.Succeeded) {
      if (audioStatus === CheckAudioInputFeedback.Failed) {
        status = 'Failed to connect with mircrophone.';
        message = 'FailedToConnectMicrophone';
      } else if (audioStatus === CheckAudioInputFeedback.PermissionDenied) {
        status = 'Mircrophone is blocked. Please check device permission.';
        message = 'MicrophoneIsBlocked';
      }
    }
    return status ? (
      <Alert variant="warning" className="alert alert-warning">
        {t(message, status)}
      </Alert>
    ) : null;
  };

  const initializeMeeting = async () => {
    try {
      await chime.createDeviceSelectionRoom(eventUrl);
      setMeetingStatus({ status: 'Succeeded' });
      await chime.joinRoom(audioElement);
      deviceSelection();
    } catch (error) {
      setMeetingStatus({
        status: 'Failed',
        errorMessage: 'FailedToJoinMeeting',
      });
    }
  };

  useEffect(() => {
    if (eventUrl) {
      initializeMeeting();
    }
    return async () => {
      if (chime.audioVideo && videoPreviewElement.current) {
        await chime?.audioVideo?.stopVideoPreviewForVideoInput(videoPreviewElement.current);
        await chime.audioVideo.stopVideoInput();
      }
      await stopAudioPreview();
      await chime.leaveRoom(eventUrl);
    };
  }, []);

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
      // data.push({ value: 'OFF', key: 10, label: 'OFF' });
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

  const handleMicrophoneChange = async (selectedDevice) => {
    const filteredDevice = audioInputDevices.filter((obj) => obj.value === selectedDevice.value);
    setCurrentAudioInputDevice(filteredDevice[0]);
    audioInputPreview(filteredDevice[0]);
  };

  const handleSpeakerChange = async (selectedDevice) => {
    const filteredDevice = audioOutputDevices.filter((obj) => obj.value === selectedDevice.value);
    setCurrentAudioOutputDevice(filteredDevice[0]);
    await chime.chooseAudioOutputDevice(filteredDevice[0]);
  };

  const handleVideoQualityChange = async (event) => {
    await chime.changeVideoQuality(event.value);
    if (chime?.audioVideo) {
      await chime.audioVideo.stopVideoPreviewForVideoInput(videoPreviewElement.current);
      await chime.audioVideo.stopVideoInput();
    }
    await videoInputPreview(chime.currentVideoInputDevice);
  };

  return (
    <div className="deviceList setting-popup">
      {meetingStatus.status === Status.Loading && (
        <div className="text-center">
          <AESpinner type="SpinnerSmall" />
        </div>
      )}
      {meetingStatus.status === Status.Failed && <h3>{t(meetingStatus.errorMessage)}</h3>}
      {meetingStatus.status === Status.Succeeded && (
        <>
          <audio ref={audioElement} className="d-none" />
          {renderDeviceStatus(audioStatus, videoStatus)}
          <div id="flow-devices" className="flow">
            <div className="">
              <form id="form-devices">
                <div className="row">
                  <div className="col-sm-12 mb-2">
                    <div className="d-flex blod-icob-text">
                      <AEIcons
                        svgIcon="virtual-icon-audio-new"
                        viewBox="0 0 28 28"
                        size="small"
                        dataPrefix="fas"
                        dataIcon="microphone-slash"
                      />
                      <span>{t('Audio')}</span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-12">
                    <div className="d-flex">
                      <AELabel
                        subHeader={t('Microphone')}
                        labelClass="title-text"
                        className="m-r-10"
                        htmlFor="microphone"
                        id="microphone_label"
                      />
                    </div>
                    <AESelect
                      onChange={handleMicrophoneChange}
                      name="microphone"
                      id="microphone"
                      isSearchable={false}
                      value={(currentAudioInputDevice && currentAudioInputDevice.value) || ''}
                      disabled={!audioInputDevices || !audioInputDevices.length}
                      options={getMicrophoneDevices()}
                      aria-label="Select audio input device"
                      placeholder={t('common:Select')}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      closeMenuOnScroll
                    />
                  </div>
                </div>
                <div className="row mt-3 d-flex voice-text ">
                  <div className="col-sm-12 ">
                    <div className="w-100 progress ">
                      {audioPreviewStatus === 'Enabled' && (
                        <div
                          id="audio-preview"
                          className="progress-bar bg-success"
                          role="progressbar"
                          aria-valuenow="0"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="m-b-10">
                  <AECheckbox
                    message={t('TurnOffAudioWhenJoining')}
                    name="table"
                    id={`check-11`}
                    disabled={!audioInputDevices || !audioInputDevices.length}
                    checked={audioPreviewStatus === 'Disabled'}
                    onChange={handleLocalAudio}
                    tabIndex="-1"
                  />
                </div>
                {isAudioOutputAvailabel && (
                  <div className="row mt-1">
                    <div className="col-12 col-sm-12">
                      <div className="d-flex">
                        <AELabel
                          labelClass="title-text"
                          subHeader={t('Speakers')}
                          className="m-r-10"
                          htmlFor="camera"
                          id="camera_label"
                        />
                      </div>
                      <AESelect
                        onChange={handleSpeakerChange}
                        name="speaker"
                        id="speaker"
                        value={(currentAudioOutputDevice && currentAudioOutputDevice.value) || ''}
                        disabled={!audioOutputDevices || !audioOutputDevices.length}
                        options={getSpeakerDevices()}
                        aria-label="select output Speaker device"
                        placeholder={t('common:Select')}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        closeMenuOnScroll
                      />
                    </div>
                  </div>
                )}
                <div className="row mt-3 d-flex voice-text">
                  <div
                    className="col-sm-3 cursor"
                    onClick={() => {
                      audioTest();
                    }}
                  >
                    <div className="test-voice w-100">
                      <p className="d-block text-center">{t('common:Test')}</p>
                    </div>
                  </div>
                  <div className="col-sm-9 pl-0">
                    <audio id="speaker-test-audio-element" className="d-none" />
                    {showSpeakerPreviewStatus === 'INITIATED' ? (
                      <span id="speaker-user-feedback" className="d-flex  m-t-5">
                        <span className="m-r-5">{t('CanYouHearSound')}</span>
                        <div className="m-l-5">
                          <AERadioButton
                            value={'YES'}
                            name="speakerOption"
                            id="speakerOption1"
                            defaultChecked={isSpeakerWorking === 'YES'}
                            onChange={(e) => {
                              handleSpeakerVoiceOption(e);
                            }}
                            label={t('common:Yes')}
                          />
                        </div>
                        <div className="m-l-5">
                          <AERadioButton
                            value={'NO'}
                            name="speakerOption"
                            id="speakerOption2"
                            defaultChecked={isSpeakerWorking === 'NO'}
                            onChange={(e) => {
                              handleSpeakerVoiceOption(e);
                            }}
                            label={t('common:No')}
                          />
                        </div>
                      </span>
                    ) : (
                      <div className="w-100 progress mb-0">
                        <div
                          id="speaker-preview"
                          className={cx(
                            'progress-bar ',
                            showSpeakerPreviewStatus === 'Succeeded'
                              ? 'width-100-percent progress-bar-success'
                              : showSpeakerPreviewStatus === 'Failed' && ' width-100-percent progress-bar-danger',
                          )}
                          role="progressbar"
                          aria-valuenow="0"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          <div className="">{t(`common:${showSpeakerPreviewStatus}`)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-12">
                    <div className="horizontal-line-veh mt-4 mb-4" />
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-8">
                    <div className="d-flex blod-icob-text m-t-5">
                      <AEIcons
                        svgIcon="virtual-icon-stage-new"
                        viewBox="0 0 28 28"
                        size="small"
                        dataPrefix="fas"
                        dataIcon="microphone-slash"
                      />
                      <span>{t('Video')}</span>
                    </div>
                  </div>

                  <div className="col-sm-4 text-right d-sm-block video-preview">
                    {videoPreviewStatus === 'Loading' && (
                      <div className="text-center">
                        <AESpinner type="SpinnerTiny" />
                      </div>
                    )}
                    <video id="video-preview" ref={videoPreviewElement} className="w-100 h-100 preview-box" />
                  </div>
                </div>
                <div className="row mt-0">
                  <div className="col-12 col-sm-12">
                    <AELabel labelClass="title-text" subHeader={t('Camera')} htmlFor="speaker" id="speaker_label" />
                    <AESelect
                      onChange={handleCameraChange}
                      name="camera"
                      id="camera"
                      value={(currentVideoInputDevice && currentVideoInputDevice.value) || ''}
                      disabled={!videoInputDevices || !videoInputDevices.length}
                      options={getCameraDevices()}
                      aria-label="Select Camera Input device"
                      placeholder={t('common:Select')}
                    />

                    <div className="mt-3">
                      <AELabel
                        labelClass="title-text"
                        subHeader={t('VideoQuality')}
                        htmlFor="camera"
                        id="camera_label"
                      />
                      <AESelect
                        onChange={handleVideoQualityChange}
                        name="video-quality"
                        value={chime.currentVideoQuality}
                        disabled={!videoInputDevices || !videoInputDevices.length}
                        options={getVideoQualityList()}
                        aria-label="Select Video Quality"
                        placeholder={t('common:Select')}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        closeMenuOnScroll
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-12 mt-3">
                    <AECheckbox
                      message={t('TurnOffVideoWhenJoining')}
                      name="table"
                      disabled={!videoInputDevices || !videoInputDevices.length}
                      checked={videoPreviewStatus === 'Disabled'}
                      className="success"
                      onClick={handleLocalVideoTiles}
                      id="cam1"
                    />
                  </div>
                </div>
                <div className="row mt-0">
                  <div className="text-right">
                    <div className="col-sm-12 margin-top-mobile submit-fixed">
                      <AEButton
                        disabled={videoPreviewStatus === 'Loading' || audioPreviewStatus === 'Loading'}
                        onClick={() => {
                          chime.storeSelectedDevices();
                          props.joinMeeting();
                        }}
                        label={t('common:Save')}
                        aria-label={'Join the workshop'}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <AEPopup
              id="ReadinessPopup"
              showModal={showChimeMeetingReadinessChecker}
              headerText={<p>{t('MeetingReadinessChecker')}</p>}
              backdrop="static"
              backdropClassName={'BackColorOpacity'}
              onCloseFunc={readinessCheckerDone}
              accessibilityProps={{ tabIndex: '0', 'aria-label': 'Meeting Readiness Checker' }}
            >
              <div className="center-align">
                <DefaultMeetingReadinessChecker onCloseChecker={readinessCheckerDone} />
              </div>
            </AEPopup>
          </div>
        </>
      )}
    </div>
  );
}
export default DeviceSelection;
