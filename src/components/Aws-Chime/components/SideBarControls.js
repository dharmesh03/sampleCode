// eslint-disable-next-line jsx-a11y/anchor-has-content
import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import { withRouter } from 'react-router';
import { useTranslation } from 'react-i18next';
import PopupModal from '../../PopupModal';
import AETooltip from '../../../Core/Tooltip';
import getChimeContext from '../context/getChimeContext';
import AEButton from '../../../Core/Button/Button';
import AEInputField from '../../../Core/Input';
import AEIcons from '../../../Core/Icon/index';

function SideBarControls(props) {
  const { viewMode, onClickShareButton, isContentShareEnabled } = props || {};
  const chime = useContext(getChimeContext());
  const [muted, setMuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState('Enabled');
  const [opened, setOpened] = useState(false);
  const [confirmationPopup, setConfirmationPopup] = useState(false);

  const { t } = useTranslation(['controller', 'common', 'deviceSelection']);

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

  const handleFileChange = (e) => {
    if (e?.target?.files?.length > 0) {
      const file = e.target.files[0];
      setOpened(!opened);
      onClickShareButton('video', file);
    }
  };

  useEffect(() => {
    const element = document.getElementById('current_screen_btn');
    element && element.focus();
  }, [opened]);

  return (
    <div className="">
      <nav id="portalsidebar">
        <div className="sidebar">
          <ul className="list-unstyled components mb-5">
            <li className="sidebar-icon-box">
              <AETooltip
                tooltip={muted ? t('Your microphone is muted.') : t('Your microphone is on.')}
                overlayProps={{ placement: 'top' }}
              >
                <AEButton
                  className={cx('ip-bg custom-btn-icon', muted && 'btn-pulse-animation', {
                    enabled: !muted,
                  })}
                  aria-label={muted ? 'Your microphone is muted.' : 'Your microphone is on.'}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      if (muted) {
                        chime.audioVideo && (await chime.audioVideo.realtimeUnmuteLocalAudio());
                      } else {
                        chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
                      }
                      // Adds a slight delay to close the tooltip before rendering the updated text in it
                      await new Promise((resolve) => setTimeout(resolve, 10));
                    }
                  }}
                  onClick={async () => {
                    if (muted) {
                      chime.audioVideo && (await chime.audioVideo.realtimeUnmuteLocalAudio());
                    } else {
                      chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
                    }
                    // Adds a slight delay to close the tooltip before rendering the updated text in it
                    await new Promise((resolve) => setTimeout(resolve, 10));
                  }}
                >
                  {muted ? (
                    <AEIcons
                      svgIcon="virtual-icon-microphone-slash"
                      viewBox="0 0 640 512"
                      size="large"
                      dataPrefix="fas"
                      dataIcon="microphone-slash"
                      className="b-icon"
                    />
                  ) : (
                    <AEIcons
                      svgIcon="virtual-icon-microphone"
                      viewBox="0 0 352 512"
                      size="medium"
                      dataPrefix="fas"
                      dataIcon="microphone"
                      className="b-icon"
                    />
                  )}
                </AEButton>
              </AETooltip>
            </li>

            <li className="sidebar-icon-box">
              <AETooltip
                overlayProps={{ placement: 'top' }}
                tooltip={videoStatus === 'Enabled' ? t('Your camera is on.') : t('Your camera is off.')}
              >
                <AEButton
                  className="p-t-10 ip-bg"
                  onClick={async () => {
                    // Adds a slight delay to close the tooltip before rendering the updated text in it
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    if (videoStatus === 'Disabled') {
                      setVideoStatus('Loading');
                      try {
                        if (chime && !chime.currentVideoInputDevice) {
                          throw new Error('currentVideoInputDevice does not exist');
                        }
                        await chime.chooseVideoInputDevice(chime.currentVideoInputDevice);
                        chime.audioVideo && (await chime.audioVideo.startLocalVideoTile());
                        setVideoStatus('Enabled');
                      } catch (error) {
                        console.error(error);
                        setVideoStatus('Disabled');
                      }
                    } else if (videoStatus === 'Enabled') {
                      setVideoStatus('Loading');
                      chime.audioVideo && (await chime.audioVideo.stopVideoInput());
                      setVideoStatus('Disabled');
                    }
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      await new Promise((resolve) => setTimeout(resolve, 10));
                      if (videoStatus === 'Disabled') {
                        setVideoStatus('Loading');
                        try {
                          if (chime && !chime.currentVideoInputDevice) {
                            throw new Error('currentVideoInputDevice does not exist');
                          }
                          await chime.chooseVideoInputDevice(chime.currentVideoInputDevice);
                          chime.audioVideo && (await chime.audioVideo.startLocalVideoTile());
                          setVideoStatus('Enabled');
                        } catch (error) {
                          console.error(error);
                          setVideoStatus('Disabled');
                        }
                      } else if (videoStatus === 'Enabled') {
                        setVideoStatus('Loading');
                        chime.audioVideo && (await chime.audioVideo.stopVideoInput());
                        setVideoStatus('Disabled');
                      }
                    }
                  }}
                  aria-label={videoStatus === 'Enabled' ? 'Your camera is on.' : 'Your camera is off.'}
                  icon={`b-icon  ${
                    videoStatus === 'Enabled' ? 'virtual-icon-stage-outlined' : 'virtual-icon-stage-muted'
                  }`}
                />
              </AETooltip>
            </li>
            <li id="screenshare-container" className={cx('sidebar-icon-box ', opened ? 'on' : '')}>
              <AETooltip tooltip={t('controller:Share Screen')} overlayProps={{ placement: 'top' }}>
                <AEButton
                  className="ip-bg"
                  onClick={() => {
                    setOpened(true);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && setOpened(true)}
                  aria-label="Share Screen"
                  icon="b-icon virtual-icon-share-screen"
                />
              </AETooltip>
            </li>
            <li className=" sidebar-icon-box">
              <AETooltip tooltip={t('deviceSelection:Device Switcher')} overlayProps={{ placement: 'top' }}>
                <AEButton
                  className="ip-bg"
                  onClick={() => {
                    props.toggleSettingsSideBar();
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && props.toggleSettingsSideBar()}
                  aria-label="Device Switcher"
                  icon={'b-icon ac-icon-settings'}
                />
              </AETooltip>
            </li>
            <li className="sidebar-icon-box">
              <AETooltip tooltip={t('common:End')} overlayProps={{ placement: 'top' }}>
                <AEButton
                  className="ip-bg p-t-10"
                  onClick={() => {
                    setConfirmationPopup(true);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && setConfirmationPopup(true)}
                  aria-label="End"
                  icon={'b-icon virtual-icon-end'}
                />
              </AETooltip>
            </li>
          </ul>
          {viewMode !== 'ScreenShare' && !isContentShareEnabled && (
            <>
              {opened && (
                <div>
                  <div className="bubble-tip">
                    <a
                      className="icon-close-box"
                      title="Close"
                      currentitem="false"
                      onClick={() => setOpened(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setOpened(false)}
                      tabIndex="0"
                      role="button"
                      aria-label="Dialog content ends. Close share screen settings"
                    >
                      <i className="fa fa-times" />
                    </a>
                    <h3 className="title m-0 font-s14">{'Share options'}</h3>
                    <div className="m-t-10 text-center">
                      <AEButton
                        id="current_screen_btn"
                        onClick={() => {
                          setOpened(false);
                          onClickShareButton('Screen');
                        }}
                        icon="fa fa-desktop"
                        aria-label="Dialog content starts. Click here to share current screen."
                      />
                      <AEButton
                        className="m-l-20"
                        onClick={() => {
                          const videoPresentationUpload = document.getElementById('videoPresentationUpload');
                          if (videoPresentationUpload) {
                            videoPresentationUpload.click();
                          }
                        }}
                        icon="fa fa-video-camera"
                        aria-label="Click here to upload video and share"
                      />
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
                    <div className="anchor-popup" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>
      <PopupModal
        onCloseFunc={() => setConfirmationPopup(false)}
        id="confirmationPopup"
        showModal={confirmationPopup}
        headerText={<p>{t('common:Confirm')}</p>}
        modelFooter={
          <div>
            <AEButton
              className="small"
              onClick={() => {
                setConfirmationPopup(false);
              }}
              label="Stay"
            />
            <AEButton
              variant="danger"
              className="small m-l-5"
              onClick={() => {
                props.onLeave();
              }}
              label={t('common:Leave')}
            />
          </div>
        }
      >
        <div className="center-align">
          <p className="text-center">{t('AreYouSureWantToLeave')}</p>
        </div>
      </PopupModal>
    </div>
  );
}
export default withRouter(SideBarControls);
