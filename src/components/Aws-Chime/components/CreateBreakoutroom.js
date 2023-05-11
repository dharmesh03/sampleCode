import React, { useContext, useState } from 'react';
import { Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import size from 'lodash/size';
import { useTranslation } from 'react-i18next';
import { DefaultModality } from 'amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';
import useRoster from '../hooks/useRoster';
import AEButton from '../../../Core/Button/Button';
import AERadioButton from '../../../Core/RadioButton/RadioButton';
import AEInputField from '../../../Core/Input';
import { MessageTopic } from '../enums/MeetingConstant';
import WithParams from '../../WrapperComponents/WithParams';
import {
  createBreakoutRooms,
  doGetBreakoutRooms,
  doDeleteBreakoutRooms,
} from '../../../routes/event/portal/Workshop/action';

function CreateBreakoutroom(props) {
  const { showMessage, eventUrl, session, setShowCreateRoomPopup } = props;
  const { sessionId } = session || {};
  const [breakoutDisable, setbreakoutDisable] = useState(false);
  const chime = useContext(getChimeContext());
  const [createBreakoutRoomsCount, setCreateBreakoutRoomsCount] = useState(1);
  const [createBreakoutRoomsMode, setCreateBreakoutRoomsMode] = useState('Manually');
  const roster = useRoster();
  const { t } = useTranslation(['breakoutRoom', 'common', 'chime']);

  const rosterData = Object.entries(roster)
    .filter(([attendeeId]) => attendeeId !== chime.attendeeId && !!roster[attendeeId].userId)
    .map(([key, value]) => ({ attendeeId: key, ...value }));

  const isValidRoomCount = () => createBreakoutRoomsCount >= 1 && createBreakoutRoomsCount <= 10;

  const handleInputChange = (count) => {
    setCreateBreakoutRoomsCount(count);
  };

  const arrayPartation = (attendees, n) => {
    if (n < 2) return [attendees];
    const len = attendees.length;
    const sortedArray = [];
    let i = 0;
    let size;

    if (len % n === 0) {
      size = Math.floor(len / n);
      while (i < len) {
        sortedArray.push(attendees.slice(i, (i += size)));
      }
    } else {
      while (i < len) {
        size = Math.ceil((len - i) / n--);
        sortedArray.push(attendees.slice(i, (i += size)));
      }
    }
    return sortedArray;
  };

  const createBreakoutRooms = () => {
    if (!isValidRoomCount()) {
      showMessage(t('PleaseEnterValidNoOfBreakoutRooms'), true);
      return;
    }
    if (eventUrl && sessionId) {
      setbreakoutDisable(true);
      props
        .createBreakoutRooms(eventUrl, sessionId, createBreakoutRoomsCount)
        .then((res) => {
          if (res && !res.errorMessage) {
            setShowCreateRoomPopup(false);
            if (createBreakoutRoomsMode === 'Automatically') {
              const attendeesChunk = arrayPartation(rosterData, createBreakoutRoomsCount);
              attendeesChunk.map((value, key) => {
                const room = res[key];
                if (size(value) > 0 && room) {
                  value.forEach((attednee) => {
                    if (attednee?.attendeeId) {
                      const modality = new DefaultModality(attednee?.attendeeId);
                      if (!modality.hasModality(DefaultModality.MODALITY_CONTENT)) {
                        chime.sendMessage(attednee.attendeeId, {
                          type: 'JOIN-BREAKOUT-ROOM',
                          roomId: room.breakoutRoomId,
                          sessionId,
                          eventUrl,
                        });
                      }
                    }
                  });
                }
              });
            } else {
              chime.sendMessage(MessageTopic.GeneralDataMessage, {
                type: 'UPDATE-BREAKOUT-ROOM',
              });
            }
            setbreakoutDisable(false);
            setShowCreateRoomPopup(false);
            showMessage(t('BreakoutRoomsUpdatedSuccessfully'));
            props.doGetBreakoutRooms(eventUrl, sessionId);
          }
        })
        .catch(() => {
          setbreakoutDisable(false);
          setShowCreateRoomPopup(false);
        });
    }
  };

  const renderRosterChunk = (rosterData) => {
    const attendeesChunk = arrayPartation(rosterData, createBreakoutRoomsCount);

    return (
      <div>
        {attendeesChunk &&
          attendeesChunk.map((attendees, index) => (
            <div className="manage-session-interactivity m-t-5">
              <h5 className="attendee-name-ellipsis">{`${t('chime:Room')}-${index + 1}`}</h5>
              {attendees &&
                attendees.map((attendee) => (
                  <div key={attendee && attendee.attendeeId} className="attendee d-flex justify-content-between">
                    <span className="attendee-name-ellipsis">{attendee && attendee.name}</span>
                  </div>
                ))}
            </div>
          ))}
      </div>
    );
  };

  const changeCreateOption = ({ target }) => {
    setCreateBreakoutRoomsMode(target.value);
  };

  return (
    <div className="">
      <div className="p-b-10">
        <Col md={9} xs={12} className="session-color-font p-l-0">
          {t('NumberOfRooms')}
          <p className="help-text">{t('HowManyRoomDoYouWantToCreate')}</p>
        </Col>
        <Col md={3} xs={12} className="p-0">
          <AEInputField
            inputType="Numeric"
            pattern="[0-9]+([\.,][0-9]+)?"
            step="1"
            name="breakoutRoomCount"
            id="breakoutRoomCount"
            size="normal"
            onChange={handleInputChange}
            onBlur={(e) => {
              handleInputChange(e.target.value);
            }}
            value={createBreakoutRoomsCount}
            valid={isValidRoomCount()}
            feedBackText={
              createBreakoutRoomsMode === 'Automatically'
                ? t('EnterValidNoOfBreakoutRoomAsManyAttendee')
                : t('EnterValidNoOfBreakoutRoomMaxFive')
            }
            isFeedBackShow={!isValidRoomCount()}
          />
        </Col>
      </div>
      <div>
        <hr className="m-t-0 m-b-10" />
        <div className="session-color-font">{t('AssignParticipants')}</div>
        <div>
          <div className="p-b-10">
            <div className="manage-session-interactivity">
              <AERadioButton
                value={'Automatically'}
                name="createOption"
                id="createOption1"
                onChange={(e) => changeCreateOption(e)}
                label={t('AutomaticallyAssignEachParticipantRoom')}
                checked={createBreakoutRoomsMode === 'Automatically'}
              />
              <p className="help-text m-l-25">
                {isValidRoomCount()
                  ? t('AssignPeopleToRooms', { attendeeCount: size(rosterData), RoomsCount: createBreakoutRoomsCount })
                  : ''}
              </p>

              {createBreakoutRoomsMode === 'Automatically' && (
                <div>
                  {size(rosterData) > 0 ? (
                    renderRosterChunk(rosterData)
                  ) : (
                    <p className="red">{t('NoAttendeesPresentInMeeting')}</p>
                  )}
                </div>
              )}
            </div>
            <div className="manage-session-interactivity m-t-10">
              <AERadioButton
                value={'Manually'}
                name="createOption"
                id="createOption2"
                checked={createBreakoutRoomsMode === 'Manually'}
                onChange={(e) => changeCreateOption(e)}
                label={t('AddIndividualParticipantsToBreakoutRooms')}
              />
              {/* <p className="help-text m-l-25">Add participants individual to breakout rooms</p> */}
            </div>
          </div>
        </div>
        <div>
          <div className="text-right">
            <AEButton
              variant="secondary"
              className="m-r-5"
              onClick={() => {
                setShowCreateRoomPopup(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowCreateRoomPopup(false);
                }
              }}
            >
              {t('common:Cancel')}
            </AEButton>
            <AEButton
              onClick={() => {
                createBreakoutRooms();
              }}
              disabled={!isValidRoomCount() || breakoutDisable}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createBreakoutRooms();
                }
              }}
            >
              {t('CreateRooms')}
            </AEButton>
          </div>
        </div>
      </div>
    </div>
  );
}
const mapDispatchToProps = {
  createBreakoutRooms,
  doGetBreakoutRooms,
  doDeleteBreakoutRooms,
};
const mapStateToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(CreateBreakoutroom));
