import React, { useContext, useEffect, useState } from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import AEButton from '../../../Core/Button/Button';
import AEIcons from '../../../Core/Icon/index';
import AEInputField from '../../../Core/Input';
import CreateBreakoutroom from './CreateBreakoutroom';
import { MessageTopic, IsFrom } from '../enums/MeetingConstant';
import AESpinner from '../../../Core/Spinner/Spinner';
import AETooltip from '../../../Core/Tooltip';

import WithParams from '../../WrapperComponents/WithParams';
import {
  doGetBreakoutRooms,
  doDeleteBreakoutRooms,
  doUpdateBreakoutRoom,
} from '../../../routes/event/portal/Workshop/action';
import AEPopup from '../../../Core/Popup';

function BreakoutItemView(props) {
  const { showMessage, eventUrl, session, breakoutRooms, roomId, switchRoom } = props;
  const { sessionId } = session || {};
  const chime = useContext(getChimeContext());
  const [showCreateRoomPopup, setShowCreateRoomPopup] = useState(false);
  const [showUpdateRoomPopup, setShowUpdateRoomPopup] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationPopup, setConfirmationPopup] = useState(false);
  const [showTitleLength, setShowTitleLength] = useState(false);

  const { t } = useTranslation(['breakoutRoom', 'common', 'controller']);

  const handleInputChange = ({ target }) => {
    const roomName = target.value;
    if (selectedRoom && roomName) {
      setSelectedRoom((previous) => ({
        ...previous,
        roomName,
      }));
    }
  };

  const getBreakoutRooms = () => {
    if (eventUrl && sessionId) {
      props
        .doGetBreakoutRooms(eventUrl, sessionId)
        .then(() => {
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setShowCreateRoomPopup(false);
        });
    }
  };

  const doUpdateBreakoutRoom = () => {
    if (eventUrl && sessionId && selectedRoom) {
      props
        .doUpdateBreakoutRoom(eventUrl, sessionId, selectedRoom)
        .then((res) => {
          if (res && !res.errorMessage) {
            setSelectedRoom(null);
            getBreakoutRooms();
            chime.sendMessage(MessageTopic.GeneralDataMessage, {
              type: 'UPDATE-BREAKOUT-ROOM',
            });
            setShowUpdateRoomPopup(false);
            showMessage(t('BreakoutRoomsUpdatedSuccessfully'));
          } else {
            showMessage((res && res.errorMessage) || t('ErrorWhileUpdateBreakoutRoom'), true);
          }
        })
        .catch(() => {});
    }
  };

  const deleteBreakoutRooms = (breakoutRoomId) => {
    if (eventUrl && sessionId && breakoutRoomId) {
      if (chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM) {
        chime.sendMessage(MessageTopic.GeneralDataMessage, {
          type: 'DELETE-ROOM',
        });
      }
      props
        .doDeleteBreakoutRooms(eventUrl, sessionId, breakoutRoomId)
        .then((res) => {
          if (res && !res.errorMessage) {
            if (chime.isFrom === IsFrom.WORKSHOP) {
              chime.sendMessage(MessageTopic.GeneralDataMessage, {
                type: 'UPDATE-BREAKOUT-ROOM',
              });
            }
            getBreakoutRooms();
            showMessage(t('BreakoutRoomsDeletedSuccessfully'));
          } else {
            showMessage((res && res.errorMessage) || t('ErrorWhileDeleteBreakoutRoom'), true);
          }
          setConfirmationPopup(false);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    getBreakoutRooms();
  }, []);

  return (
    <div className="breakout-tab m-b-20 p-5">
      <div className="justify-content-between p-10">
        <div className="display-inline-flex">
          <AEIcons size="small" type="virtual-icon-expo-outlined" />
          <span className="m-label m-l-5"> {t('controller:BreakoutRoom')}</span>
        </div>
        <div className="pull-right cursor simple_hover_focus_effect_2 hover_focus_effect_1">
          <AEIcons
            size="small"
            className="fa fa-times close_icon_line_height"
            onClick={() => props.toggleBreakoutSideBar()}
          />
        </div>
      </div>
      <hr className="m-t-0 m-b-10" />
      {chime.isFrom === IsFrom.WORKSHOP && chime.isModerator && (
        <div>
          <AEButton
            variant="secondary"
            block
            onClick={() => setShowCreateRoomPopup(true)}
            size="small"
            isPrevIcon
            icon="ae-exSmall virtual-icon-add"
            label={t('AddRoom')}
          />
          <hr className="m-t-b-10" />
        </div>
      )}
      {chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM && chime.isModerator && (
        <div>
          <AEButton
            variant="secondary"
            className="end-room-btn"
            block
            onClick={() => {
              setSelectedRoom(roomId);
              setConfirmationPopup(true);
            }}
            size="small"
            isPrevIcon
            icon="ae-exSmall font-s14 virtual-icon-end"
            label={t('EndRoom')}
          />
          <hr className="m-t-b-10" />
        </div>
      )}

      <div>
        {!loading ? (
          breakoutRooms &&
          breakoutRooms.map(
            (breakoutRoom) =>
              breakoutRoom && (
                <div key={breakoutRoom.breakoutRoomId} className="rooms">
                  <span className="name">
                    <AETooltip
                      tooltip={breakoutRoom.roomName}
                      overlayProps={{ placement: 'top' }}
                      tooltipProps={{ id: `breakoutRoomName${breakoutRoom.roomName}` }}
                    >
                      <div className="overflow-txt-ellipsis">{breakoutRoom.roomName}</div>
                    </AETooltip>
                  </span>
                  <div className="muted">
                    <div className="display-inline-flex align-items-center">
                      {chime.isFrom === IsFrom.WORKSHOP && chime.isModerator && (
                        <span className="simple_hover_focus_effect_2 hover_focus_effect_1">
                          <AEIcons
                            size="small"
                            className="icon virtual-icon-edit cursor back_rooms_icon"
                            onClick={() => {
                              setSelectedRoom(breakoutRoom);
                              setShowUpdateRoomPopup(true);
                            }}
                          />
                        </span>
                      )}
                      {chime.isFrom === IsFrom.WORKSHOP && chime.isModerator && (
                        <span className="simple_hover_focus_effect_2 hover_focus_effect_1">
                          <AEIcons
                            size="small"
                            className="icon virtual-icon-trash cursor back_rooms_icon"
                            onClick={() => {
                              setSelectedRoom(breakoutRoom.breakoutRoomId);
                              setConfirmationPopup(true);
                            }}
                          />
                        </span>
                      )}
                      {chime.isFrom === IsFrom.WORKSHOP && (
                        <span
                          className="join-label cursor"
                          onClick={async () => {
                            // Leaving for breakout room passing TRUE as 2nd arg
                            await chime.leaveRoom(eventUrl);
                            await new Promise((resolve) => setTimeout(resolve, 500));
                            props.history.push(
                              `/e/${eventUrl}/portal/workshops/${sessionId}/breakoutRoom/${breakoutRoom.breakoutRoomId}`,
                            );
                          }}
                        >
                          {t('common:Join')}
                        </span>
                      )}
                      {chime.isFrom === IsFrom.WORKSHOP_BREAKOUTROOM &&
                        breakoutRoom.breakoutRoomId.toString() !== roomId && (
                          <span className="join-label cursor" onClick={() => switchRoom(breakoutRoom.breakoutRoomId)}>
                            {t('common:Switch')}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ),
          )
        ) : (
          <div className="text-center">
            <AESpinner type="SpinnerExtraSmall" />
          </div>
        )}
      </div>
      <AEPopup
        onCloseFunc={() => setShowCreateRoomPopup(false)}
        id="confirmationPopup"
        showModal={showCreateRoomPopup}
        headerText={t('CreateBreakoutRoom')}
        headerClass="m-b-30"
      >
        <CreateBreakoutroom
          session={session}
          eventUrl={eventUrl}
          showMessage={showMessage}
          setShowCreateRoomPopup={() => setShowCreateRoomPopup(false)}
        />
      </AEPopup>
      <AEPopup
        onCloseFunc={() => setShowUpdateRoomPopup(false)}
        id="confirmationPopup"
        showModal={showUpdateRoomPopup}
        headerText={t('UpdateBreakoutRoom')}
        headerClass="m-b-30"
        modelFooter={
          <AEButton
            onClick={() => {
              doUpdateBreakoutRoom();
            }}
          >
            {t('common:Submit')}
          </AEButton>
        }
      >
        <div className="h-100-px">
          <AEInputField
            type="text"
            name="breakoutRoomName"
            id="breakoutRoomName"
            placeholder={t('EnterNameOfRooms')}
            message={t('UpdateThisBreakoutRoom')}
            size="normal"
            value={selectedRoom && selectedRoom.roomName}
            onChange={(e) => handleInputChange(e)}
            onFocus={() => setShowTitleLength(true)}
            onBlur={() => setShowTitleLength(false)}
            maxLength={45}
            feedBackText={`${selectedRoom?.roomName ? selectedRoom?.roomName?.length : 0}/45`}
            isFeedBackShow={showTitleLength}
          />
        </div>
      </AEPopup>
      <AEPopup
        onCloseFunc={() => setConfirmationPopup(false)}
        id="confirmationPopup"
        showModal={confirmationPopup}
        headerText={t('common:Confirm')}
        headerClass="m-b-30"
        modelFooter={
          <div>
            <AEButton
              className="reserved-button m-r-5"
              onClick={() => {
                deleteBreakoutRooms(selectedRoom);
              }}
              variant="success"
              label={t('common:Confirm')}
            />
            <AEButton
              className="reserved-button"
              onClick={() => {
                setConfirmationPopup(false);
              }}
              variant="danger"
              label={t('common:Close')}
            />
          </div>
        }
      >
        <div className="center-align">
          <p className="text-center">{t('DeleteBreakoutRoomConfirmation')}</p>
        </div>
      </AEPopup>
    </div>
  );
}
const mapDispatchToProps = {
  doGetBreakoutRooms,
  doDeleteBreakoutRooms,
  doUpdateBreakoutRoom,
};
const mapStateToProps = (state) => ({
  breakoutRooms: get(state.virtualEvent, 'workshopBreakoutRooms'),
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(BreakoutItemView));
