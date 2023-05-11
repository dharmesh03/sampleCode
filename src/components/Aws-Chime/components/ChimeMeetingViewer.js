import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { xor } from 'lodash-es';
import Error from './Error';
import Alerts from '../../Widget/Alerts';
import getChimeContext from '../context/getChimeContext';
import { ViewMode, Status, IsFrom } from '../enums/MeetingConstant';
import AESpinner from '../../../Core/Spinner/Spinner';
import WithParams from '../../WrapperComponents/WithParams';
import TileLayout from './TileLayout';
import useRoster from '../hooks/useRoster';
import usePrevious from '../../../hooks/usePrevious';
import { apiUrl as API_URL } from '../../../clientConfig';
import { ContentShareProvider } from '../providers/ContentShareProvider';

function ChimeMeetingViewer(props) {
  const { meetingId, params } = props;
  const chime = useContext(getChimeContext());
  const roster = useRoster();
  const prevRoster = usePrevious(Object.keys(roster));
  const [isContentShareEnabled, setIsContentShareEnabled] = useState(false);
  const [viewMode] = useState(ViewMode.Room);
  const [isModeTransitioning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({
    status: 'Loading',
    errorMessage: '',
  });
  const audioElement = useRef(null);

  const { t } = useTranslation(['chime']);

  const showMessage = (message, isError) => {
    setMessage(message);
    setIsError(isError);
    setLoading(false);
    setTimeout(() => {
      setMessage('');
    }, 4000);
  };

  const leaveMeeting = async () => {
    if (chime) {
      chime.leaveRoom(params.params);
    }
  };

  const stopWorkshopRecording = () => {
    const settings = {
      method: 'POST',
    };
    fetch(`${API_URL}events/${params.params}/backstage/session/${params.sessionId}/chime/stopRecording`, settings)
      .then((resp) => {
        if (!resp?.ok) {
          setTimeout(() => {
            stopWorkshopRecording();
          }, 5000);
        }
      })
      .catch((error) => {
        if (error) {
          setTimeout(() => {
            stopWorkshopRecording();
          }, 5000);
        }
      });
  };

  useEffect(() => {
    //  check if there is any change in roster
    const currentRoster = Object.keys(roster);
    const diff = xor(currentRoster, prevRoster);
    if (
      diff.length &&
      diff[0] !== chime.attendeeId &&
      chime.isFrom === IsFrom.BACKSTAGEROOM &&
      currentRoster?.length === 1 &&
      currentRoster[0] === chime.attendeeId
    ) {
      /*
        when roster is updated (means only Broadcast user is active) then stop recording ECS task 
      */
      setMeetingEnded(true);

      stopWorkshopRecording();
    }
  }, [chime.audioVideo, prevRoster, roster, chime.attendeeId, chime.isFrom]);

  const initializeMeeting = async () => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const isDynamicUser = params.get('isDynamicUser');
    try {
      await chime.createViewerRoom(meetingId, params.params, isDynamicUser);
      setMeetingStatus({
        status: 'Succeeded',
      });
    } catch (error) {
      console.error(error);
      setMeetingStatus({
        status: 'Failed',
        errorMessage: error.message,
      });
    }
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
            leaveMeeting();
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
    try {
      chime.audioVideo && (await chime.audioVideo.bindAudioElement(audioElement.current));
    } catch (e) {
      console.error('Failed to bind audio element', e);
    }
    const audioOutputDeviceInfo = chime && chime.audioOutputDevices && chime.audioOutputDevices[0];
    if (audioOutputDeviceInfo) {
      await chime.chooseAudioOutputDevice(audioOutputDeviceInfo);
    }
    chime.audioVideo && (await chime.audioVideo.start());
  };

  useEffect(() => {
    if (params && params.params && meetingId && meetingId !== 'undefined') {
      initializeMeeting();
    } else {
      setMeetingStatus({
        status: 'Error',
        errorMessage: 'MeetingIdNotFound',
      });
    }
  }, [meetingId]);

  const onContentShareEnabled = useCallback(
    async (enabled) => {
      setIsContentShareEnabled(enabled);
    },
    [viewMode],
  );

  return (
    <ContentShareProvider>
      <div className="viewer-room">
        {message && <Alerts message={message} loading={loading} isError={isError} />}
        <audio ref={audioElement} className="d-none" />
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
              <Error errorMessage={t(meetingStatus.errorMessage)} onLeave={() => leaveMeeting(false)} />
            )}
            {meetingStatus.status === Status.Succeeded && !meetingEnded && (
              <>
                <div className="left">
                  <div className="remoteVideoGroupWrapper">
                    <TileLayout
                      isContentShareEnabled={isContentShareEnabled}
                      onContentShareEnabled={onContentShareEnabled}
                      viewMode={viewMode}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ContentShareProvider>
  );
}
const mapDispatchToProps = {};
export default connect(null, mapDispatchToProps)(WithParams(ChimeMeetingViewer));
