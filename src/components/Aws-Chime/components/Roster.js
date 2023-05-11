import cx from 'classnames';
import React, { useContext, useEffect, useState } from 'react';
import uniq from 'lodash/uniq';
import size from 'lodash/size';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import useRoster from '../hooks/useRoster';
import useRaisedHandAttendees from '../hooks/useRaisedHandAttendees';
import { IsFrom, MessageTopic } from '../enums/MeetingConstant';
import AEButton from '../../../Core/Button/Button';
import AEIcons from '../../../Core/Icon/index';
import AELabel from '../../../Core/Label/label';
import { AEDropDown, AEMenuItem } from '../../../Core/Dropdown';
import AEPopup from '../../../Core/Popup';
import { getLocalStorage } from '../../Widget/Utility/Utility';

export default function Roster(props) {
  const {
    showMessage,
    attendeeAction,
    realTimeRequestAttendees,
    leaveMeeting,
    joinBreakoutRoom,
    eventId,
    userId,
  } = props;
  const chime = useContext(getChimeContext());
  const roster = useRoster();
  const [videoAttendees, setVideoAttendees] = useState(new Set());
  const [isVideo, setIsVideo] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(false);
  const [confirmationPopup, setConfirmationPopup] = useState(false);
  const raisedHandAttendees = useRaisedHandAttendees();
  const [kickedUser, setKickedUser] = useState([]);
  const { t } = useTranslation(['chime', 'common']);
  /*
    clicking mutiple time on kick was causing SignalingBadRequest exception on other attendee side,
    because we are trying to send data message to attendee even after attendee is kicked out (left meeting).
    Due to this sometime camera light was remaining on. To avoid that we are clocking mutiple clicks here.
  */
  const blockKickout = (attendeeId) => {
    const blockedIds = [...kickedUser];
    blockedIds.push(attendeeId);
    setKickedUser(uniq(blockedIds));
    setTimeout(() => {
      setKickedUser((currentBlocked) => currentBlocked.filter((id) => id !== attendeeId));
    }, 5000);
  };

  const realtimeSubscribeToReceiveDataMessage = async () => {
    chime.audioVideo &&
      (await chime.audioVideo.realtimeSubscribeToReceiveDataMessage(chime.attendeeId, async (data) => {
        try {
          const receivedData = (data && data.json()) || {};
          const { type, name, roomId } = receivedData || {};
          if (chime.isFrom === IsFrom.EXHIBITOR_PORTAL && (type === 'UNMUTE' || type === 'VIDEO-ENABLE')) {
            return;
          }
          if (type === 'UNMUTE') {
            setIsVideo(false);
            setConfirmationMessage(t('AdminEnableYourAudio', { name: name || t('Moderator') }));
            setConfirmationPopup(true);
          } else if (type === 'MUTE') {
            showMessage(t('AdminDisabledYourAudio', { name }), false);
            chime.audioVideo && (await chime.audioVideo.realtimeMuteLocalAudio());
          } else if (type === 'KICK') {
            showMessage(t('ModeratorRemovedYouFromSession'), false);
            await new Promise((resolve) => setTimeout(resolve, 200));
            if (leaveMeeting) leaveMeeting(true);
          } else if (type === 'VIDEO-DISABLE') {
            chime.audioVideo && (await chime.audioVideo.stopVideoInput());
            showMessage(t('ModeratorDisabledYourVideo'), false);
          } else if (type === 'VIDEO-ENABLE') {
            setIsVideo(true);
            setConfirmationMessage(t('ModeratorEnableYourVideo', { name: name || t('Moderator') }));
            setConfirmationPopup(true);
          } else if ((type === 'ADMIT' || type === 'DENIED') && attendeeAction) {
            attendeeAction(type);
          } else if (type === 'JOIN-BREAKOUT-ROOM' && roomId && joinBreakoutRoom) {
            joinBreakoutRoom(roomId);
          }
        } catch (err) {
          chime.setStreamLog(err.stack);
        }
      }));
  };

  const allowToEnableDevices = async () => {
    if (isVideo) {
      if (chime.currentVideoInputDevice) {
        const vbData =
          getLocalStorage('virtualBackgroundEffect') !== undefined &&
          getLocalStorage('virtualBackgroundEffect') !== null
            ? getLocalStorage('virtualBackgroundEffect')
            : null;

        // eslint-disable-next-line
        if (vbData && eventId && userId && eventId == vbData.eventId && userId == vbData.userId) {
          await chime.setVirtualBackgroundEffect(vbData.effectType, vbData.value, eventId, userId);
        } else {
          await chime.chooseVideoInputDevice(chime.currentVideoInputDevice);
          chime.audioVideo && (await chime.audioVideo.startLocalVideoTile());
        }
      }
    } else {
      chime.audioVideo && (await chime.audioVideo.realtimeUnmuteLocalAudio());
    }
    setConfirmationPopup(false);
  };

  useEffect(() => {
    realtimeSubscribeToReceiveDataMessage();
    const tileIds = {};
    const realTimeVideoAttendees = new Set();
    const removeTileId = (tileId) => {
      const removedAttendeeId = tileIds[tileId];
      delete tileIds[tileId];
      realTimeVideoAttendees.delete(removedAttendeeId);
      setVideoAttendees(new Set(realTimeVideoAttendees));
    };

    const observer = {
      videoTileDidUpdate: (tileState) => {
        if (!tileState.boundAttendeeId || tileState.isContent || !tileState.tileId) {
          return;
        }

        if (tileState.active) {
          tileIds[tileState.tileId] = tileState.boundAttendeeId;
          realTimeVideoAttendees.add(tileState.boundAttendeeId);
          setVideoAttendees(new Set(realTimeVideoAttendees));
        } else {
          removeTileId(tileState.tileId);
        }
      },
      videoTileWasRemoved: (tileId) => {
        removeTileId(tileId);
      },
    };

    chime.audioVideo && chime.audioVideo.addObserver(observer);
    return () => {
      chime.audioVideo && chime.audioVideo.removeObserver(observer);
    };
  }, [chime.audioVideo]);

  let attendeeIds;
  if (chime.meetingSession && roster) {
    attendeeIds = Object.keys(roster).filter((attendeeId) => {
      const isContent = chime.isContentShareAttendee(attendeeId);
      return !!roster[attendeeId].name && !isContent;
    });
  }

  return (
    <div className="roster">
      <div className="justify-content-between d-flex align-items-center p-10">
        <div className="display-inline-flex align-center">
          <AEIcons color="#252525" svgIcon="virtual-icon-bar-users" viewBox="0 0 28 28" />
          <AELabel
            color={'#000000'}
            variant={'body2'}
            header={`${t('common:Attendees')} (${size(attendeeIds)})`}
            labelClass="m-l-5 m-b-0"
          />
        </div>
        <div className="pull-right simple_hover_focus_effect_2 hover_focus_effect_1 cursor">
          <AEIcons
            size="small"
            id="closeAttendee"
            className="fa fa-times roster_close_icon"
            onClick={() => props.toggleSettingsSideBar()}
          />
        </div>
      </div>
      <hr className="m-t-0 m-b-10" />
      <>
        {attendeeIds &&
          attendeeIds.map((attendeeId) => {
            const rosterAttendee = roster[attendeeId];
            return (
              <div key={attendeeId} className="attendee justify-content-between">
                <div className=" attendee-name-ellipsis">
                  <div className="d-flex">
                    <span className="attendee-name-ellipsis"> {rosterAttendee.name}</span>
                    {(chime.isFrom === IsFrom.WORKSHOP ||
                      chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM ||
                      chime.isFrom === IsFrom.NETWORKING_LOUNGE) && (
                      <>
                        {raisedHandAttendees.has(attendeeId) ? (
                          <div
                            onClick={() => {
                              if (chime.attendeeId === attendeeId || chime.isModerator)
                                chime.sendRaiseHandMessage(MessageTopic.DismissHand, attendeeId);
                            }}
                            className="raisedHand cursor"
                          >
                            <span role="img">✋</span>
                          </div>
                        ) : (
                          ''
                          // <div
                          //   onClick={() => {
                          //     if (chime.attendeeId === attendeeId)
                          //       chime.sendRaiseHandMessage(MessageTopic.RaiseHand, attendeeId);
                          //   }}
                          //   className="downHand"
                          // >
                          //   <span role="img" className="f-c-white">
                          //     ✋🏻
                          //   </span>
                          // </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="attendee-actions">
                  {chime.isModerator && realTimeRequestAttendees && realTimeRequestAttendees.has(attendeeId) && (
                    <div className="m-r-10">
                      <a
                        className="cursor"
                        id="cursor"
                        onClick={() => {
                          realTimeRequestAttendees.delete(attendeeId);
                          chime.sendMessage(attendeeId, {
                            type: 'ADMIT',
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            realTimeRequestAttendees.delete(attendeeId);
                            chime.sendMessage(attendeeId, {
                              type: 'ADMIT',
                            });
                          }
                        }}
                        role="button"
                        tabIndex="0"
                        aria-label="Admit attendee"
                      >
                        {t('common:Answer')}
                      </a>
                    </div>
                  )}
                  {videoAttendees && (
                    <div className="simple_hover_focus_effect_2 hover_focus_effect_1">
                      <a
                        className="cursor outline_offset_2 line_height_0 d-block"
                        onClick={() => {
                          if (chime.isModerator) {
                            chime.sendMessage(attendeeId, {
                              type: videoAttendees.has(attendeeId) ? 'VIDEO-DISABLE' : 'VIDEO-ENABLE',
                            });
                          } else {
                            showMessage(t('PermissionDeniedYouAreNotModerator'), true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (chime.isModerator) {
                              chime.sendMessage(attendeeId, {
                                type: videoAttendees.has(attendeeId) ? 'VIDEO-DISABLE' : 'VIDEO-ENABLE',
                              });
                            } else {
                              showMessage(t('PermissionDeniedYouAreNotModerator'), true);
                            }
                          }
                        }}
                        tabIndex="0"
                        role="button"
                        aria-label={`${
                          videoAttendees.has(attendeeId) ? 'Click to disable video for' : 'Click to enable video for'
                        } ${rosterAttendee && rosterAttendee.name}`}
                      >
                        {videoAttendees.has(attendeeId) ? (
                          <AEIcons
                            svgIcon="virtual-icon-bar-camera-on"
                            size="small"
                            className="line_height_0"
                            viewBox="0 0 28 28"
                            id="cameraOn"
                          />
                        ) : (
                          <AEIcons
                            svgIcon="virtual-icon-bar-camera-off"
                            size="small"
                            viewBox="0 0 28 28"
                            className="line_height_0"
                            id="cameraOff"
                          />
                        )}
                      </a>
                    </div>
                  )}
                  {typeof rosterAttendee.muted === 'boolean' && (
                    <div className="simple_hover_focus_effect_2 hover_focus_effect_1">
                      <a
                        className="cursor outline_offset_2 line_height_0 d-block"
                        onClick={() => {
                          if (chime.isModerator) {
                            chime.sendMessage(attendeeId, {
                              type: rosterAttendee.muted ? 'UNMUTE' : 'MUTE',
                            });
                          } else {
                            showMessage(t('PermissionDeniedYouAreNotModerator'), true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (chime.isModerator) {
                              chime.sendMessage(attendeeId, {
                                type: rosterAttendee.muted ? 'UNMUTE' : 'MUTE',
                              });
                            } else {
                              showMessage(t('PermissionDeniedYouAreNotModerator'), true);
                            }
                          }
                        }}
                        tabIndex="0"
                        role="button"
                        aria-label={`${
                          rosterAttendee && rosterAttendee.muted ? 'Click to Unmute Mic for' : 'Click to Mute Mic for'
                        } ${rosterAttendee && rosterAttendee.name}`}
                      >
                        {rosterAttendee && rosterAttendee.muted ? (
                          <AEIcons
                            svgIcon="virtual-icon-bar-microphone-mute"
                            viewBox="0 0 28 28"
                            size="small"
                            dataPrefix="fas"
                            dataIcon="microphone-slash"
                            className="line_height_0"
                            id="microphoneMute"
                          />
                        ) : (
                          <AEIcons
                            className={cx(
                              { 'active-speaker': rosterAttendee.active },
                              {
                                'weak-signal': rosterAttendee.signalStrength && rosterAttendee.signalStrength < 50,
                              },
                              'line_height_0',
                            )}
                            svgIcon="virtual-icon-bar-microphone-unmute"
                            viewBox="0 0 28 28"
                            dataPrefix="fas"
                            dataIcon="microphone"
                            size="small"
                            id="microphoneUnmute"
                          />
                        )}
                      </a>
                    </div>
                  )}
                  {chime.isModerator && chime.attendeeId !== attendeeId && (
                    <AEDropDown
                      pullRight
                      isShowCaret={false}
                      className="font-s14 icon attendee-settings remove_focus hover_focus_effect_1"
                      id="dropdown-basic"
                      icon="fa fa-ellipsis-v"
                      aria-label="Device Switcher Settings"
                      tabIndex="0"
                    >
                      <AEMenuItem
                        onSelect={() => {
                          if (kickedUser.includes(attendeeId)) {
                            return;
                          }
                          blockKickout(attendeeId);
                          chime.sendMessage(attendeeId, {
                            type: 'KICK',
                          });
                        }}
                      >
                        <div className="d-flex">
                          <AEIcons svgIcon="virtual-icon-remove-circle" viewBox="0 0 18 20" className="mr-2" />
                          <span>{t('RemoveFromTheMeeting')}</span>
                        </div>
                      </AEMenuItem>
                    </AEDropDown>
                  )}
                </div>

                {/* <AELabel
                  subHeader={rosterAttendee.name}
                  className="name"
                  labelClass="label-ellipsis line-1 text-ellipsis"
                />

                {chime.isModerator && realTimeRequestAttendees && realTimeRequestAttendees.has(attendeeId) && (
                  <div className="m-r-10">
                    <a
                      className="cursor"
                      onClick={() => {
                        realTimeRequestAttendees.delete(attendeeId);
                        chime.sendMessage(attendeeId, {
                          type: 'ADMIT',
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          realTimeRequestAttendees.delete(attendeeId);
                          chime.sendMessage(attendeeId, {
                            type: 'ADMIT',
                          });
                        }
                      }}
                      role="button"
                      tabIndex="0"
                      aria-label="Admit attendee"
                    >
                      Answer
                    </a>
                  </div>
                )}

                {videoAttendees && (
                  <div>
                    <a
                      className="cursor"
                      onClick={() => {
                        if (chime.isModerator) {
                          chime.sendMessage(attendeeId, {
                            type: videoAttendees.has(attendeeId) ? 'VIDEO-DISABLE' : 'VIDEO-ENABLE',
                          });
                        } else {
                          showMessage('Permission denied! You are not moderator in this meeting.', true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (chime.isModerator) {
                            chime.sendMessage(attendeeId, {
                              type: videoAttendees.has(attendeeId) ? 'VIDEO-DISABLE' : 'VIDEO-ENABLE',
                            });
                          } else {
                            showMessage('Permission denied! You are not moderator in this meeting.', true);
                          }
                        }
                      }}
                      tabIndex="0"
                      role="button"
                      aria-label={`Click to Enable or Disable video for ${rosterAttendee.name}`}
                    >
                      {videoAttendees.has(attendeeId) ? (
                        <AEIcons svgIcon="virtual-icon-bar-camera-on" size="small" viewBox="0 0 28 28" />
                      ) : (
                        <AEIcons svgIcon="virtual-icon-bar-camera-off" size="small" viewBox="0 0 28 28" />
                      )}
                    </a>
                  </div>
                )}
                {typeof rosterAttendee.muted === 'boolean' && (
                  <div className="m-2">
                    <a
                      className="cursor "
                      onClick={() => {
                        if (chime.isModerator) {
                          chime.sendMessage(attendeeId, {
                            type: rosterAttendee.muted ? 'UNMUTE' : 'MUTE',
                          });
                        } else {
                          showMessage('Permission denied! You are not moderator in this meeting.', true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (chime.isModerator) {
                            chime.sendMessage(attendeeId, {
                              type: rosterAttendee.muted ? 'UNMUTE' : 'MUTE',
                            });
                          } else {
                            showMessage('Permission denied! You are not moderator in this meeting.', true);
                          }
                        }
                      }}
                      tabIndex="0"
                      role="button"
                      aria-label={`Click to Mute or Unmute Mic for ${rosterAttendee.name}`}
                    >
                      {rosterAttendee.muted ? (
                        <AEIcons
                          svgIcon="virtual-icon-bar-microphone-mute"
                          viewBox="0 0 28 28"
                          size="small"
                          dataPrefix="fas"
                          dataIcon="microphone-slash"
                        />
                      ) : (
                        <AEIcons
                          className={cx(
                            { 'active-speaker': rosterAttendee.active },
                            {
                              'weak-signal': rosterAttendee.signalStrength && rosterAttendee.signalStrength < 50,
                            },
                          )}
                          svgIcon="virtual-icon-bar-microphone-unmute"
                          viewBox="0 0 28 28"
                          dataPrefix="fas"
                          dataIcon="microphone"
                          size="small"
                        />
                      )}
                    </a>
                  </div>
                )}
                {chime.isModerator && chime.attendeeId !== attendeeId && (
                  <AEDropDown
                    pullRight
                    isShowCaret={false}
                    className="font-s14 icon attendee-settings"
                    id="dropdown-basic"
                    icon="fa fa-ellipsis-v"
                    aria-label="Device Switcher Settings"
                  >
                    <AEMenuItem
                      onSelect={() => {
                        if (kickedUser.includes(attendeeId)) {
                          return;
                        }
                        blockKickout(attendeeId);
                        chime.sendMessage(attendeeId, {
                          type: 'KICK',
                        });
                      }}
                    >
                      Remove From Meeting
                    </AEMenuItem>
                  </AEDropDown>
                )} */}
              </div>
            );
          })}
      </>
      <AEPopup
        onCloseFunc={() => setConfirmationPopup(false)}
        id="confirmationPopup"
        showModal={confirmationPopup}
        headerText={t('common:Confirm')}
        headerClass="m-b-30"
        modelFooter={
          <div>
            <AEButton
              className="m-r-5"
              id="allow"
              onClick={() => {
                allowToEnableDevices();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  allowToEnableDevices();
                }
              }}
              aria-label={`${confirmationMessage} Allow.`}
            >
              {t('common:Allow')}
            </AEButton>
            <AEButton
              variant="danger"
              id="deny"
              onClick={() => {
                setConfirmationPopup(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setConfirmationPopup(false);
                }
              }}
              aria-label={`${confirmationMessage} Denied.`}
            >
              {t('common:Deny')}
            </AEButton>
          </div>
        }
      >
        <div className="center-align">
          <p className="text-center">{confirmationMessage}</p>
        </div>
      </AEPopup>
    </div>
  );
}
