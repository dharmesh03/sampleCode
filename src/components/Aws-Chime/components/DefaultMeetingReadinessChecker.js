/* eslint-disable jsx-a11y/heading-has-content */
import React, { useEffect, useState, useContext } from 'react';
import {
  CheckAudioInputFeedback,
  CheckAudioOutputFeedback,
  CheckVideoInputFeedback,
  IntervalScheduler,
} from 'amazon-chime-sdk-js';
import useDevices from '../hooks/useDevices';
import getChimeContext from '../context/getChimeContext';
import AEButton from '../../../Core/Button/Button';
import AEBadge from '../../../Core/Badge/Badge';
import AESpinner from '../../../Core/Spinner/Spinner';

let canHear = null;
export default function DefaultMeetingReadinessChecker(props) {
  const chime = useContext(getChimeContext());
  const deviceSwitcherState = useDevices();
  const audioInputDevices = deviceSwitcherState.audioInputDevices;
  const audioOutputDevices = deviceSwitcherState.audioOutputDevices;
  const videoInputDevices = deviceSwitcherState.videoInputDevices;
  const [checkerStatus, setCheckerStatus] = useState('');
  // const [iscontentShareEnable, setIscontentShareEnable] = useState(false);

  const [currentAudioInputDevice, setCurrentAudioInputDevice] = useState({});
  const [currentAudioOutputDevice, setCurrentAudioOutputDevice] = useState({});
  const [currentVideoInputDevice, setCurrentVideoInputDevice] = useState({});

  const setTestPreviewPercent = (step) => {
    let percent = 33.33; // Total 8 step here
    percent *= step;
    const audioPreview = document.getElementById('test-progress');
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

  const createReadinessHtml = (id, textToDisplay) => {
    const readinessElement = document.getElementById(id);
    if (!readinessElement) return;
    readinessElement.innerHTML = '';
    readinessElement.innerText = textToDisplay === 'ConnectionFailed' ? 'Connection Failed' : textToDisplay;
    if (id === 'readiness-header') {
      return;
    }
    if (textToDisplay === 'spinner-border') {
      readinessElement.innerHTML = '';
      readinessElement.className = '';
      readinessElement.className = <AESpinner type="SpinnerExtraSmall" />;
      readinessElement.style.color = '#666';
    } else if (textToDisplay && textToDisplay.includes('Succeeded')) {
      readinessElement.className = '';
      readinessElement.className = 'ae-badge success';
      readinessElement.style.color = '';
    } else {
      readinessElement.className = 'ae-badge warning';
      readinessElement.style.color = '';
    }
  };

  const audioTest = async () => {
    if (!currentAudioOutputDevice) {
      return;
    }
    createReadinessHtml('speaker-test', 'spinner-border');
    const speakerUserFeedbackHtml = document.getElementById('speaker-user-feedback');
    const audioElement = document.getElementById('speaker-test-audio-element');
    speakerUserFeedbackHtml.style.display = 'inline-block';
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
    createReadinessHtml('speaker-test', textToDisplay);
    speakerUserFeedbackHtml.style.display = 'none';
  };

  const micTest = async () => {
    if (!currentAudioInputDevice) {
      return;
    }
    createReadinessHtml('mic-test', 'spinner-border');
    const audioInputResp =
      chime.meetingReadinessChecker && (await chime.meetingReadinessChecker.checkAudioInput(currentAudioInputDevice));
    createReadinessHtml('mic-test', CheckAudioInputFeedback[audioInputResp]);
  };

  const videoTest = async () => {
    if (!currentVideoInputDevice) {
      return;
    }
    createReadinessHtml('video-test', 'spinner-border');
    const videoInputResp =
      chime.meetingReadinessChecker && (await chime.meetingReadinessChecker.checkVideoInput(currentVideoInputDevice));
    const textToDisplay = CheckVideoInputFeedback[videoInputResp];
    createReadinessHtml('video-test', textToDisplay);
  };

  // const cameraTest = async () => {
  //   if (!currentVideoInputDevice) {
  //     return;
  //   }
  //   createReadinessHtml('camera-test2', 'spinner-border');
  //   const cameraResolutionResp1 =
  //     chime.meetingReadinessChecker &&
  //     (await chime.meetingReadinessChecker.checkCameraResolution(currentVideoInputDevice, 640, 480));
  //   const cameraResolutionResp2 =
  //     chime.meetingReadinessChecker &&
  //     (await chime.meetingReadinessChecker.checkCameraResolution(currentVideoInputDevice, 1280, 720));
  //   const cameraResolutionResp3 =
  //     chime.meetingReadinessChecker &&
  //     (await chime.meetingReadinessChecker.checkCameraResolution(currentVideoInputDevice, 1920, 1080));
  //   let textToDisplay = `${CheckCameraResolutionFeedback[cameraResolutionResp1]}@640x480p`;
  //   createReadinessHtml('camera-test1', textToDisplay);
  //   textToDisplay = `${CheckCameraResolutionFeedback[cameraResolutionResp2]}@1280x720p`;
  //   createReadinessHtml('camera-test2', textToDisplay);
  //   textToDisplay = `${CheckCameraResolutionFeedback[cameraResolutionResp3]}@1920x1080p`;
  //   createReadinessHtml('camera-test3', textToDisplay);
  // };

  // const contentShareStart = async () => {
  //   setIscontentShareEnable(false);
  //   createReadinessHtml('contentshare-test', 'spinner-border');
  //   const contentShareResp =
  //     chime.meetingReadinessChecker && (await chime.meetingReadinessChecker.checkContentShareConnectivity());
  //   createReadinessHtml('contentshare-test', CheckContentShareConnectivityFeedback[contentShareResp]);
  // };

  // const contentShareTest = async () => {
  //   setIscontentShareEnable(true);
  // };

  // const audioConnectivityTest = async () => {
  //   if (!currentAudioInputDevice) return;
  //   createReadinessHtml('audioconnectivity-test', 'spinner-border');
  //   const audioConnectivityResp =
  //     chime.meetingReadinessChecker &&
  //     (await chime.meetingReadinessChecker.checkAudioConnectivity(currentAudioInputDevice.value));
  //   createReadinessHtml('audioconnectivity-test', CheckAudioConnectivityFeedback[audioConnectivityResp]);
  //   await chime.chooseAudioInputDevice(currentAudioInputDevice);
  // };

  // const videoConnectivityTest = async () => {
  //   if (!currentVideoInputDevice) return;
  //   createReadinessHtml('videoconnectivity-test', 'spinner-border');
  //   const videoConnectivityResp =
  //     chime.meetingReadinessChecker &&
  //     (await chime.meetingReadinessChecker.checkVideoConnectivity(currentVideoInputDevice.value));
  //   createReadinessHtml('videoconnectivity-test', CheckVideoConnectivityFeedback[videoConnectivityResp]);
  // };

  // const networkTcpTest = async () => {
  //   createReadinessHtml('networktcp-test', 'spinner-border');
  //   const networkTcpResp =
  //     chime.meetingReadinessChecker && (await chime.meetingReadinessChecker.checkNetworkTCPConnectivity());
  //   createReadinessHtml('networktcp-test', CheckNetworkTCPConnectivityFeedback[networkTcpResp]);
  //   return networkTcpResp;
  // };

  // const networkUdpTest = async () => {
  //   createReadinessHtml('networkudp-test', 'spinner-border');
  //   const networkUdpResp =
  //     chime.meetingReadinessChecker && (await chime.meetingReadinessChecker.checkNetworkUDPConnectivity());
  //   createReadinessHtml('networkudp-test', CheckNetworkUDPConnectivityFeedback[networkUdpResp]);
  //   return networkUdpResp;
  // };

  const initEventListeners = async () => {
    if (!chime.meetingReadinessChecker) return;
    await setCheckerStatus('STARTED');
    document.getElementById('speaker-yes')?.focus();
    document.getElementById('speaker-yes').addEventListener('input', (e) => {
      e.preventDefault();
      canHear = true;
    });
    document.getElementById('speaker-no').addEventListener('input', (e) => {
      e.preventDefault();
      canHear = false;
    });
    createReadinessHtml('readiness-header', 'Readiness tests underway...');
    await audioTest();
    setTestPreviewPercent(1);
    await micTest();
    setTestPreviewPercent(2);
    await videoTest();
    setTestPreviewPercent(3);
    // await cameraTest();
    // setTestPreviewPercent(4);
    // await networkUdpTest();
    // setTestPreviewPercent(5);
    // await networkTcpTest();
    // setTestPreviewPercent(6);
    // await audioConnectivityTest();
    // setTestPreviewPercent(7);
    // await videoConnectivityTest();
    // setTestPreviewPercent(8);
    // await contentShareTest();
    createReadinessHtml('readiness-header', 'Readiness tests complete!');
    setCheckerStatus('END');
  };

  const deviceSelection = async () => {
    if (audioInputDevices && audioInputDevices.length > 0) {
      setCurrentAudioInputDevice(
        deviceSwitcherState.currentAudioInputDevice
          ? deviceSwitcherState.currentAudioInputDevice
          : audioInputDevices[0],
      );
    }
    if (audioOutputDevices && audioOutputDevices.length > 0) {
      setCurrentAudioOutputDevice(
        deviceSwitcherState.currentAudioOutputDevice
          ? deviceSwitcherState.currentAudioOutputDevice
          : audioOutputDevices[0],
      );
    }
    if (videoInputDevices && videoInputDevices.length > 0) {
      setCurrentVideoInputDevice(
        deviceSwitcherState.currentVideoInputDevice
          ? deviceSwitcherState.currentVideoInputDevice
          : videoInputDevices[0],
      );
    }
  };

  useEffect(() => {
    canHear = null;
    deviceSelection();
  }, []);

  return (
    <div className="readiness-checker">
      <div id="flow-readinesstest" className="flow text-center">
        <div className="version-readiness text-muted " id="sdk-version-readiness" />
        <form id="form-authenticate">
          <div className="mt-3">
            <p>Check to make sure your device is ready to join the meeting.</p>
          </div>
          <div className="mt-3">
            <div id="progress-authenticate" className="w-100 progress progress-hidden">
              <div
                id="test-progress"
                className="w-100 progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        </form>
        <div className="radiness-check-table">
          <h1 id="readiness-header" className="h3 mb-3 font-weight-normal" />
          <audio id="speaker-test-audio-element" className="d-none" />
          <table className="table">
            <thead>
              <tr>
                <th className="text-left">Readiness Test Type</th>
                <th className="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-left">Speaker</td>
                <td id="speaker-row">
                  <AEBadge id="speaker-test" variant="secondary" size="small" label="Not Started" />
                  <span id="speaker-user-feedback" className="speaker-user-feedback m-l-5">
                    <span>Can you hear a sound?</span>
                    <label className="m-l-5">
                      <input
                        type="radio"
                        id="speaker-yes"
                        name="user-feedback-reply"
                        value="yes"
                        aria-label="Can you hear a sound? Yes."
                      />
                      Yes
                    </label>
                    <label className="m-l-5">
                      <input
                        type="radio"
                        id="speaker-no"
                        name="user-feedback-reply"
                        value="no"
                        aria-label="Can you hear a sound? No."
                      />
                      No
                    </label>
                  </span>
                </td>
              </tr>
              <tr>
                <td className="text-left">Mic</td>
                <td>
                  <AEBadge id="mic-test" variant="secondary" size="small" label="Not Started" />
                </td>
              </tr>
              <tr>
                <td className="text-left">Camera</td>
                <td>
                  <AEBadge id="video-test" variant="secondary" size="small" label="Not Started" />
                </td>
              </tr>
              {/* <tr>
                <td className="text-left">Resolution</td>
                <td>
                  <span id="camera-test1" />
                  <AEBadge id="camera-test2" variant="secondary" size="small" label="Not Started" />
                  <span id="camera-test3" />
                </td>
              </tr>
              <tr>
                <td className="text-left">Network - UDP</td>
                <td>
                  <AEBadge id="networkudp-test" variant="secondary" size="small" label="Not Started" />
                </td>
              </tr>
              <tr>
                <td className="text-left">Network - TCP</td>
                <td>
                  <AEBadge id="networktcp-test" variant="secondary" size="small" label="Not Started" />
                </td>
              </tr>
              <tr>
                <td className="text-left">Audio Connectivity</td>
                <td>
                  <AEBadge id="audioconnectivity-test" variant="secondary" size="small" label="Not Started" />
                </td>
              </tr>
              <tr>
                <td className="text-left">Video Connectivity</td>
                <td>
                  <AEBadge id="videoconnectivity-test" variant="secondary" size="small" label="Not Started" />
                </td>
              </tr>
              <tr>
                <td className="text-left">Content Share</td>
                <td>
                  {iscontentShareEnable ? (
                    <AEButton
                      className="btn btn-sm btn-secondary"
                      title="Start content share test"
                      onClick={() => contentShareStart()}
                      label={'Start'}
                    />
                  ) : (
                    <AEBadge id="contentshare-test" variant="secondary" size="small" label="Not Started" />
                  )}
                </td>
              </tr> */}
            </tbody>
          </table>
          <div className="mt-3">
            {checkerStatus === '' && (
              <AEButton block onClick={(e) => initEventListeners(e)} label={'Check my device'} />
            )}
            {checkerStatus === 'END' && (
              <AEButton variant="danger" block onClick={() => props.onCloseChecker()}>
                Close
              </AEButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
