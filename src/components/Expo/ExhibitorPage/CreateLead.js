import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import size from 'lodash/size';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { saveAutoGenerateLeads, addDataToKinesis } from '../../../routes/exhibitorPortal/action';
import { getEventData } from '../../../routes/event/action/selector';
import { getUserSession } from '../../../routes/login/action/selector';
import { setExhibitor } from '../../../routes/admin/Exhibitors/action/index';
import { defaultExhibitorDefaultSettings } from '../../../constants/constData';
import { selectorVirtualEventSettings, getUserTicketTypeIds } from '../../../routes/event/action/selectorVirtualEvent';
import AEButton from '../../../Core/Button/Button';
import AEPopup from '../../../Core/Popup';

function CreateLead(props) {
  const [infoMessage, setInfoMessage] = useState('');
  const [modalHeader, setModalHeader] = useState('Success');
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(['exhibitor', 'common', 'toasterMsg']);

  const { data, pushDataToKinesis, user, virtualEventSettings, userTicketTypeIds, exhibitor } = props || {};
  const { exhibitorFieldsInJson } = data || {};
  const { hideRequestMeetingButton } = exhibitor || {};
  const { requestMeeting } = exhibitorFieldsInJson || defaultExhibitorDefaultSettings || {};

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(true);
    }, 1500);
  }, []);

  const saveAutoGenerateLeads = () => {
    const { eventDetails, data } = props || {};
    const { eventId } = eventDetails || {};
    const { exhibitorId } = data || {};
    if (pushDataToKinesis) {
      props.setRequestMeeting && props.setRequestMeeting();
      if (virtualEventSettings && virtualEventSettings.gamificationNewFlow) {
        const { userId } = user || {};
        const expoId = parseInt(exhibitorId, 10);
        const userExpoVisitData = {
          eventId,
          userId,
          gameType: '',
          area: 'EXPO',
          expoId,
          date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
          requestMeeting: true,
          ticketTypeIds: size(userTicketTypeIds) > 0 ? userTicketTypeIds : [],
        };
        if (eventId && userId && expoId) {
          addDataToKinesis(userExpoVisitData, true);
        }
      }
    }
    const isRequestedDemo = `isRequestedDemo=${true}`;
    if (requestMeeting && requestMeeting.requestMeetingURL) {
      const { requestMeetingURL } = requestMeeting;
      const setUrl = requestMeetingURL.startsWith('http') ? requestMeetingURL : `https://${requestMeetingURL}`;
      window.open(setUrl);
    }
    props
      .saveAutoGenerateLeads(Number(exhibitorId), eventId, isRequestedDemo)
      .then((resp) => {
        if (resp && resp.data) {
          setShowPopup(true);
          if (resp.data === 'Success') {
            setInfoMessage(
              t(
                get(requestMeeting, 'confirmationMessage') ||
                  get(defaultExhibitorDefaultSettings, 'requestMeeting.confirmationMessage'),
              ),
            );
            setModalHeader('Success');
            exhibitor.hideRequestMeetingButton = true;
            props.setExhibitor(exhibitor);
          } else if (resp.data === 'Lead already generated.') {
            setInfoMessage(
              t('You have previously clicked this button. Your request has been received. We will be in touch!'),
            );
            setModalHeader('Success');
          } else {
            setInfoMessage(resp.data);
            setModalHeader('Fail');
          }
        } else if (resp?.errorCode !== '4060936') {
          setShowPopup(true);
          setInfoMessage((resp && resp.errorMessage) || t('toasterMsg:Something went wrong'));
          setModalHeader('Fail');
        }
      })
      .catch(() => {
        setShowPopup(true);
        setInfoMessage(t('toasterMsg:Something went wrong'));
      });
  };

  const hidePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {isLoading ? (
        hideRequestMeetingButton ? (
          <AEButton
            className="request-meeting-btn m-b-10 received"
            onClick={() => {
              saveAutoGenerateLeads();
            }}
            size="small"
            id="requestAMeeting"
            label="Request Received"
            disabled
          />
        ) : (
          <AEButton
            className="request-meeting-btn m-b-10"
            onClick={() => {
              saveAutoGenerateLeads();
            }}
            size="small"
            id="requestAMeeting"
            label={t((requestMeeting && `exhibitor:${requestMeeting.label}`) || 'exhibitor:Request a meeting')}
          />
        )
      ) : (
        ''
      )}

      <AEPopup
        id="bookingPopup"
        showModal={showPopup}
        headerText={`${t(`toasterMsg:${modalHeader}`)}!`}
        onCloseFunc={hidePopup}
        headerClass="m-b-30"
        modelFooter={
          <div className="close-request-btn">
            <AEButton
              className="reserved-button"
              variant="danger"
              onClick={hidePopup}
              label={t('common:Close')}
              id="close"
            />
          </div>
        }
      >
        <div className="ticket-type-container image-upload-flex">{infoMessage}</div>
      </AEPopup>
    </>
  );
}

const mapDispatchToProps = {
  saveAutoGenerateLeads,
  setExhibitor,
};
const mapStateToProps = (state) => ({
  eventDetails: getEventData(state),
  user: getUserSession(state),
  exhibitor: state?.exhibitor?.exhibitor,
  virtualEventSettings: selectorVirtualEventSettings(state),
  userTicketTypeIds: getUserTicketTypeIds(state),
});
export default connect(mapStateToProps, mapDispatchToProps)(CreateLead);
