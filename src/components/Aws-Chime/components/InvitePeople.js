import React, { useEffect, useState, useContext } from 'react';
import { connect } from 'react-redux';
import { Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import CopyToClipboard from 'react-copy-to-clipboard';
import { size } from 'lodash';
import ReactTags from 'react-tag-autocomplete';
import { getAllowCallsAndConnectedPeoples } from '../../../routes/event/portal/people/action/index';
import { getUserSession } from '../../../routes/login/action/selector';
import useRoster from '../hooks/useRoster';
import { getEventData } from '../../../routes/event/action/selector';
import { getCallDetail } from '../../../routes/event/action/selectorVirtualEvent';
import { getAuthToken } from '../../Feed/action/index';
import getFeedContext from '../../People/getFeedContext';
import AEButton from '../../../Core/Button/Button';
import AETooltip from '../../../Core/Tooltip';
import AEIcons from '../../../Core/Icon/index';

function InvitePeople(props) {
  const { t } = useTranslation(['meetingDetails', 'common']);
  const { callStatus, eventData, params, loggedInUser } = props;
  const { userId: loggedInUserId, firstName: loggedInUserFirstName, lastName: loggedInUserLastName, userProfilePhoto } =
    loggedInUser || {};
  const baseDomainUrl =
    window &&
    window.location &&
    `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
  const { eventUrl, eventURL } = eventData || {};
  const [connectedAttendees, setConnectedAttendees] = useState([]);
  const [invitedAttendees, setInvitedAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const feedContext = useContext(getFeedContext());
  const roster = useRoster();
  const userIds = [];
  Object.keys(roster).map((attendeeId) => {
    if (roster[attendeeId]) userIds.push(roster[attendeeId].userId);
  });

  const getAllowCallsAndConnectedPeoples = (searchString = '') => {
    if (eventUrl || eventURL) {
      props.getAllowCallsAndConnectedPeoples(eventUrl || eventURL, searchString).then((resp) => {
        if (resp && resp.data) {
          const attendee = resp.data;
          attendee.map((person) => {
            if (size(person.name) > 20) {
              person.name = person.name.slice(0, 20).concat('...');
            }
          });
          setConnectedAttendees(attendee);
        }
      });
    }
  };

  useEffect(() => {
    getAllowCallsAndConnectedPeoples();
  }, []);

  const connectUserWithVideoCall = () => {
    const { eventId } = eventData || {};
    const selectedAttendees = invitedAttendees[0];
    const { attendeeId, userId } = selectedAttendees || {};
    const NotiAttendeeId = `${loggedInUserId.toString()}_${eventId.toString()}`;
    if (!attendeeId || !userId) {
      props.showMessage(t('Please select attendee for invite'), true);
      return;
    }
    if (userIds && userIds.indexOf(userId) > -1) {
      props.showMessage(t('Selected attendee already present in call'), true);
      return;
    }
    if (!selectedAttendees.allowCallsAndVideosFromNotConnectedAttendees && selectedAttendees.status !== 'ACCEPT') {
      props.showMessage(t('You need to connect with this user for invite to call'), true);
      return;
    }
    if ((eventUrl || eventURL) && callStatus && callStatus.videoCall) {
      if (feedContext && userId) {
        const feedClient = feedContext?.getFeedClient();
        const userNotificationFeed = feedClient?.feed('notification', `${attendeeId}_${eventId}`);
        const meetingId = params.meetingId;
        const now = new Date();
        if (feedClient?.currentUser?.id !== userId.toString() && meetingId) {
          const activityData = {
            actor: feedClient.currentUser,
            verb: 'VIDEO_CALL_REQUEST',
            object: userId.toString(),
            actorData: {
              name: `${loggedInUserFirstName} ${loggedInUserLastName}`,
              profileImage: userProfilePhoto,
              verb: 'INVITE_PEOPLE',
            },
            attendeeId: NotiAttendeeId,
            isCallRequestAccepted: false,
            time: now.toISOString(),
            foreign_id: `foreign_${loggedInUserId}`,
            meetingId,
          };

          userNotificationFeed
            .addActivity(activityData)
            .then((resp) => {
              if (resp && resp.id) {
                setLoading(false);
                props.showMessage(t('Invited successfully'), false);
                props.setIsOpenInviteBox();
              }
            })
            .catch(() => {
              setLoading(false);
              props.showMessage(t('Error While invite attendee'), true);
              props.setIsOpenInviteBox();
            });
        }
      }
    } else {
      props.showMessage(t('Attendee not found'), true);
    }
  };

  const handleAddition = (data) => {
    if (size(invitedAttendees) < 1) {
      invitedAttendees.push(data);
      setInvitedAttendees(invitedAttendees);
      const invitePopOver = document.getElementById('popover-contained-invite');
      if (invitePopOver) {
        const topStyle = parseInt(invitePopOver.style?.top, 10) - 44;
        invitePopOver.style.top = String(topStyle).concat('px');
      }
    } else {
      props.showMessage(t('Allow max 1 people to invite at a time'), true);
    }
  };

  const handleDelete = (i) => {
    if (i > -1) {
      const invitePopOver = document.getElementById('popover-contained-invite');
      if (invitePopOver) {
        const topStyle = parseInt(invitePopOver.style?.top, 10) + 44;
        invitePopOver.style.top = String(topStyle).concat('px');
      }
      invitedAttendees.splice(i, 1);
      setInvitedAttendees([...invitedAttendees]);
    }
  };

  const generateSegmentBackstageLink = () => {
    const whiteLabelHostBaseUrl = eventData?.eventDesignDetailDto?.whiteLabelHostBaseUrl;
    return `${whiteLabelHostBaseUrl || baseDomainUrl}/e/${eventUrl || eventURL}/portal/people/meetingRoom/${
      params.meetingId
    }?isInvited=true`;
  };

  const onCopy = () => {
    setCopied(true);
  };

  return (
    <div className="invite-box-tip">
      <Row className="d-flex align-items-center m-b-30">
        <Col md={10} xs={10} className="text-align-center">
          <h2 className="ae-subtitle justify-content-center m-0">{t('Invite people to this call')}</h2>
        </Col>
        <Col md={2} xs={2} className="d-flex align-items-center justify-content-end">
          <span className="simple_hover_focus_effect_2 hover_focus_effect_1 invite_box_close">
            <AEIcons onClick={props.setIsOpenInviteBox} type="fa fa-times" />
          </span>
        </Col>
      </Row>
      <Row className="m-b-10">
        <Col md={8}>
          <ReactTags
            tags={invitedAttendees}
            suggestions={connectedAttendees}
            handleDelete={handleDelete}
            handleAddition={handleAddition}
            classNames="form-control input-lg"
            autofocus={false}
            placeholder={t('Invite 1 people at a time')}
            minQueryLength={0}
            maxSuggestionsLength={50}
          />
        </Col>
        <Col md={4} className="text-right invite-button">
          <AEButton
            onClick={() => {
              connectUserWithVideoCall();
            }}
            loading={loading}
          >
            {t('common:Invite')}
          </AEButton>
        </Col>
      </Row>
      <hr />
      <Row className="m-b-10">
        <Col md={12}>
          <Col xs={11} md={11} className="liink-copy-box url-wrap">
            <span className="p-t-b-5">{t('Copy link for this call')}</span>
            <AETooltip
              tooltip={copied ? t('common:Link Copied') : t('common:Copy Link')}
              tooltipProps={{ id: 'tooltip-copy1' }}
              overlayProps={{ target: '_blank', placement: 'top' }}
              className="copy-option"
            >
              <span
                className="cursor"
                tabIndex="0"
                role="button"
                aria-label="Click to copy a link"
                onKeyDown={(e) => e.key === 'Enter' && navigator.clipboard.writeText(generateSegmentBackstageLink())}
              >
                <CopyToClipboard text={generateSegmentBackstageLink()} onCopy={onCopy}>
                  <i className="ac-icon-copy btn-icon text hover_focus_effect_1" />
                </CopyToClipboard>
              </span>
            </AETooltip>
          </Col>
        </Col>
      </Row>
    </div>
  );
}
const mapDispatchToProps = {
  getAuthToken,
  getAllowCallsAndConnectedPeoples,
};
const mapStateToProps = (state) => ({
  eventData: getEventData(state),
  callStatus: getCallDetail(state),
  loggedInUser: getUserSession(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(InvitePeople);
