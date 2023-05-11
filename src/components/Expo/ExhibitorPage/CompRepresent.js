import React, { useState, useEffect, useContext } from 'react';
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';
import map from 'lodash/map';
import filter from 'lodash/filter';
import size from 'lodash/size';
import findIndex from 'lodash/findIndex';
import values from 'lodash/values';
import xor from 'lodash/xor';
import get from 'lodash/get';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import {
  saveAutoGenerateLeads,
  selectUserForChat,
  handleUserStatusChange,
  getCompanyRepresentatives,
  addDataToKinesis,
  getAllAttendeesDetails,
} from '../../../routes/exhibitorPortal/action';
import { cloudinary_name, imgUrl as IMAGE_URL } from '../../../clientConfig';
import { getEventData, getIpLookUpTimeZone } from '../../../routes/event/action/selector';
import { getUserSession } from '../../../routes/login/action/selector';
import { selectSalesRepForChat } from '../../WebChat/action/index';
import {
  getSelectedSalesRepForChat,
  getUserTicketTypeIds,
  selectorVirtualEventSettings,
  getPortalTicketSettings,
} from '../../../routes/event/action/selectorVirtualEvent';
import usePrevious from '../../../hooks/usePrevious';
import { getTimeInLocal } from '../../../routes/event/action';
import { selectorVirtualEventAttendeeDetails } from '../../../routes/event/portal/Lobby/AttendeeDetails/action/selectorAttendeeDetails';
import { connectAttendee } from '../../../routes/event/portal/people/action/index';
import { getActivityData } from '../../Feed/action/index';
import ChatConnection from '../../WebChat/chatConnection';
import getFeedContext from '../../People/getFeedContext';
import AERepresentativeCard from '../../../Core/Card/Representative/RepresentativeCard';
import ConnectCloudWatch from '../../Aws-Cloudwatch-logger/ConnectCloudWatch';
import NewMeetWeb from '../../People/NewMeetWeb';
import { doGetEventPlanConfig } from '../../Sessions/actions/index';

let chatClient;
let channel;
let dataTimeout = null;
let userNotificationFeed = '';
let chargebeePlanName = '';

function CompRepresent(props) {
  const {
    compRepresentative,
    selectUserForChat,
    compRepStatus,
    data,
    saveAutoGenerateLeads,
    eventData,
    loggedInUser,
    handleUserStatusChange,
    selectSalesRepForChat,
    selectedSalesRepForChat,
    userExpoVisitData,
    setUserExpoVisitData,
    pushDataToKinesis,
    showStatusIndicator,
    virtualEventSettings,
    userTicketTypeIds,
    attendeeDetails,
    connectAttendee,
    getAllAttendeesDetails,
    cloudWatchClient,
    getCompanyRepresentatives,
    doGetEventPlanConfig,
    ipLookupTimeZone,
  } = props;
  const { users } = compRepStatus || {};
  const { chatEnabled } = data;
  const [compRepresent, setCompRepresentative] = useState([]);
  const [eventDates, setEventDates] = useState([]);
  const [repStatus, setRepStatus] = useState([]);
  const [load, setLoad] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const feedContext = useContext(getFeedContext());
  const { eventURL, eventUrl } = eventData || {};
  const { t } = useTranslation('exhibitor');
  const previousComRepresentative = usePrevious(compRepresentative || []);
  const defaultTimeZone = (ipLookupTimeZone && ipLookupTimeZone.name) || (eventData && eventData.equivalentTimezone);
  const [equivalentTimezone, setEquivalentTimezone] = useState(defaultTimeZone);
  const [isCompRepChatEventSent, setIsCompRepChatEventSent] = useState(false);
  const logger = async (name, event) => {
    if (!name) return;
    const data = { name, event };
    try {
      cloudWatchClient && (await cloudWatchClient.setStreamLogForChatQNAPoll(data));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setEquivalentTimezone(equivalentTimezone);
  }, [equivalentTimezone]);

  const getDates = (startDate, endDate) => {
    const dates = [];
    let currDate = startDate.startOf('day');
    if (startDate.diff(moment()) <= 0) {
      currDate = moment();
    }
    const lastDate = endDate.endOf('day');
    while (currDate.diff(lastDate) <= 0) {
      dates.push(currDate.clone().toDate());
      currDate.add(1, 'days');
    }
    return dates;
  };

  useEffect(() => {
    const { eventData, eventTicketData } = props;
    const { preEventAccessMinutes } = eventTicketData || {};
    if (eventData) {
      const { startDate, ticketingEndDate } = eventData;
      const startTimeMoment = getTimeInLocal(
        moment(startDate).subtract(preEventAccessMinutes, 'minutes'),
        equivalentTimezone,
      );
      const endTimeMoment = getTimeInLocal(moment(ticketingEndDate), equivalentTimezone);
      const days = moment.duration(endTimeMoment.diff(startTimeMoment)).asDays();
      if (days >= 0) {
        setEventDates(getDates(startTimeMoment, endTimeMoment));
      }
    }
  }, [props.eventData]);

  const addCompRepresentative = (data, compRepre) => {
    const compRep = [];
    (compRepre || compRepresent)?.forEach((element) => {
      const findUser = data.find((obj) => obj.userId === element.userId);
      element.connectionStatus = findUser && findUser.status;
      element.id = findUser && findUser.id;
      element.user = findUser && findUser.user;
      compRep.push(element);
    });
    if (size(compRep) > 0) {
      setRepStatus(compRep);
      setCompRepresentative(compRep);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    if (eventData && (eventData.eventUrl || eventData.eventURL)) {
      doGetEventPlanConfig(eventData.eventUrl || eventData.eventURL)
        .then((resp) => {
          chargebeePlanName = resp && resp.chargebeePlanName;
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, []);
  const handleUserForChat = (selectedUser) => {
    selectUserForChat({ ...selectedUser, online: selectedUser.available, firstName: selectedUser.name });
    selectSalesRepForChat(selectedUser.userId);
    const { eventId } = eventData;
    const { exhibitorId, autoGenerateLead } = data;
    if (pushDataToKinesis && userExpoVisitData && !isCompRepChatEventSent) {
      userExpoVisitData.chat = true;
      const { eventId } = eventData || {};
      const { userId } = loggedInUser || {};
      const expoId = parseInt(exhibitorId, 10);
      const tempUserExpoVisitData = {
        eventId,
        userId,
        gameType: '',
        area: 'EXPO',
        expoId,
        date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        chat: true,
        ticketTypeIds: size(userTicketTypeIds) > 0 ? userTicketTypeIds : [],
      };
      if (virtualEventSettings && virtualEventSettings.gamificationNewFlow && eventId && userId && expoId) {
        addDataToKinesis(tempUserExpoVisitData, true);
        setIsCompRepChatEventSent(true);
      }
      setUserExpoVisitData({ ...userExpoVisitData });
    }
    if (exhibitorId && autoGenerateLead) {
      saveAutoGenerateLeads(exhibitorId, eventId, '', selectedUser.userId);
    }
  };

  const statusData = () => {
    if (size(repStatus)) setCompRepresentative(repStatus);
  };

  const handleUserPresenseChanged = async (event) => {
    if (eventData && event && event.user && event.user.onlineFrom && event.user.onlineFrom === eventData.eventId) {
      const compRepStatuses = compRepStatus || {};
      if (size(compRepStatuses.channels) > 0) {
        let updatedUsers = compRepStatuses.users || [];
        const updatedChannels = map(compRepStatuses.channels, (channel) => {
          const { staffUserIds, channelUsers } = channel;
          const staffIds = staffUserIds.split(',');
          if (staffIds.indexOf(event.user.id) > -1) {
            const channelUserIndex = findIndex(channelUsers, (channelUser) => channelUser.id === event.user.id);
            const { banned, id, image, last_active, name, online, onlineFrom } = event.user;
            if (channelUserIndex > -1) {
              channelUsers[channelUserIndex] = { banned, id, image, last_active, name, online, onlineFrom };
            } else {
              channelUsers.push({ banned, id, image, last_active, name, online, onlineFrom });
            }
            updatedUsers = [...channelUsers];
          }
          channel.isOnline = size(filter(channelUsers, { online: true })) > 0;
          return channel;
        });
        if (dataTimeout) {
          clearTimeout(dataTimeout);
        }
        dataTimeout = setTimeout(() => {
          handleUserStatusChange({ channels: updatedChannels, users: updatedUsers });
        }, 1000);
      }
    }
  };

  const handleChannel = async (id, name) => {
    try {
      channel = chatClient.channel('messaging', id, {
        name,
      });
      const channelData = await channel.watch({ presence: true });
      const extractedMembers = get(channelData, 'members');
      if (extractedMembers) {
        const channelUsers = [];
        const staffIds = data.staffUserIds ? data.staffUserIds.split(',') : [];
        values({ ...extractedMembers }).map((member) => {
          if (member.user && member.user.id && staffIds.indexOf(member.user.id) > -1) {
            const { banned, id, image, last_active, name, online, onlineFrom } = member.user;
            channelUsers.push({ banned, id, image, last_active, name, online, onlineFrom });
          }
        });
        const compRepStatuses = compRepStatus || {};
        if (
          size(compRepStatuses.channels) > 0 &&
          findIndex(compRepStatuses.channels, (cmpChannel) => cmpChannel.id === channel.id) === -1
        ) {
          const customChannelData = {
            isOnline: size(filter(channelUsers, { online: true })) > 0,
            id,
            staffUserIds: data.staffUserIds,
            channelUsers,
          };
          compRepStatuses.channels.push(customChannelData);
        } else if (!size(compRepStatuses.channels)) {
          const customChannelData = {
            isOnline: size(filter(channelUsers, { online: true })) > 0,
            id,
            staffUserIds: data.staffUserIds,
            channelUsers,
          };
          compRepStatuses.channels = [customChannelData];
        }
        compRepStatuses.users = channelUsers;
        handleUserStatusChange({ ...compRepStatuses });
      }
      chatClient.on('user.presence.changed', handleUserPresenseChanged);
    } catch (error) {
      console.log('Error when watch channel', error);
      logger('CHAT Error when watch channel', error);
    }
  };

  const handleCompRespData = async (compRepre) => {
    const { eventUrl, eventURL } = eventData || {};
    // call getAllAttendees list api only if company representative list updates
    const currentUserIds = map(compRepre, (c) => c.userId);
    const previousUserIds = map(previousComRepresentative, (c) => c.userId);
    const diff = xor(currentUserIds, previousUserIds);
    if (size(compRepre) > 0 && size(diff) > 0) {
      const user_Id = [];
      compRepre?.forEach((element) => {
        user_Id.push(element.userId);
      });
      if ((eventUrl || eventURL) && size(user_Id) > 0) {
        getAllAttendeesDetails(eventUrl || eventURL, user_Id)
          .then((resp) => {
            if (resp && !resp.errorMessage && size(resp)) {
              addCompRepresentative(resp, compRepre);
            }
          })
          .catch((error) => {
            console.error(error);
            setIsLoaded(true);
          });
      } else {
        setIsLoaded(true);
      }
    } else {
      setIsLoaded(true);
    }
  };

  const getCompRep = async () => {
    const { exhibitorId } = data;
    const { eventId } = eventData;
    const resp = await getCompanyRepresentatives(exhibitorId, eventId);
    setCompRepresentative(resp);
    await handleCompRespData(resp);
    if (size(repStatus) > 0) {
      addCompRepresentative(repStatus);
    }
  };

  const init = async () => {
    const { exhibitorName, exhibitorId } = data;
    if (chatClient && chatClient._hasConnectionID()) {
      handleChannel(`Exhibitor_${exhibitorId}`, exhibitorName);
    } else {
      chatClient = await new ChatConnection().getEstablisedChatClient();
      handleChannel(`Exhibitor_${exhibitorId}`, exhibitorName);
    }
  };

  const getConnectTextByStatus = (updatedStatus) => {
    switch (updatedStatus) {
      case 'REQUESTED':
        return 'Sent';
      case 'ACCEPT':
        return 'Connected';
      case 'REJECT':
        return 'Rejected';
      default:
        return 'Connect';
    }
  };

  const connectWithUser = async (key, connectionId) => {
    const compData = [...compRepresent];
    if (load === key) {
      return;
    }
    setLoad(key);
    const { firstName, lastName, photo, userId } = attendeeDetails || {};
    const { eventUrl, eventURL, eventId } = eventData || {};
    const { userId: user, id, connectionStatus } = compData[key];
    if ((eventUrl || eventURL) && eventId && userId && connectionStatus !== 'REQUESTED' && user) {
      const attendeeId = `${userId.toString()}_${eventId.toString()}`;
      const feedClient = feedContext?.getFeedClient();
      const userNotificationFeed = feedClient?.feed('notification', `${id}_${eventId}`);
      if (feedClient?.currentUser?.id !== user.toString()) {
        const activityData = getActivityData(
          feedClient,
          'connection-request',
          user.toString(),
          firstName,
          lastName,
          photo,
          attendeeId,
        );
        activityData.isConnectRequestAccepted = false;
        activityData.foreign_id = `foreign_${userId}`;
        activityData.isReceiverUserOnline = false;
        activityData.isFromMeeting = false;
        userNotificationFeed?.addActivity(activityData).then((resp) => {
          if (resp && resp.id) {
            connectAttendee(eventUrl || eventURL, connectionId).then((resp) => {
              if (resp && resp.data) {
                compData[key].connectionStatus = 'REQUESTED';
                setLoad(null);
                setCompRepresentative([...compData]);
              }
            });
          }
        });
      }
    }
  };

  const setCompRespList = (id, verb) => {
    const compRep = [];
    const userData = id && id.split('_')[0];
    compRepresentative?.forEach((element) => {
      if (element.userId.toString() === userData) {
        if (verb === 'Connection-Rejected') {
          element.connectionStatus = 'REJECT';
        } else if (verb === 'Connection-Accepted') {
          element.connectionStatus = 'ACCEPT';
        } else if (verb === 'connection-request') {
          element.connectionStatus = 'REQUESTED';
        }
      }
      compRep.push(element);
    });
    if (compRep && compRep.length > 0) {
      setCompRepresentative(compRep);
    }
  };

  const compRepreListData = () => {
    if (eventURL || eventUrl) {
      const feedClient = feedContext?.getFeedClient();
      if (feedClient?.currentUser?.id) {
        userNotificationFeed = feedClient.feed('notification', feedClient.currentUser.id);
      }
      userNotificationFeed &&
        userNotificationFeed.subscribe((data) => {
          const receivedData = get(data, 'new[0]') || {};
          if (receivedData.verb === 'Connection-Rejected' || receivedData.verb === 'Connection-Accepted') {
            setCompRespList(receivedData.attendeeId, receivedData.verb);
          }
        });
    }
  };

  useEffect(() => {
    compRepreListData();
  }, [compRepresentative]);

  const isChatConnectionEstablised = async () => {
    const isConnected = new ChatConnection().getIsConnected();
    if (isConnected) {
      init();
    } else {
      setTimeout(() => {
        isChatConnectionEstablised();
      }, 750);
    }
  };

  useEffect(() => {
    setCompRepresentative([]);
    getCompRep();
    if (data.exhibitorId && data.staffUserIds && data.chatEnabled) {
      isChatConnectionEstablised();
    }
    return () => {
      if (chatEnabled && chatClient && chatClient.off && typeof chatClient.off === 'function') {
        chatClient.off('user.presence.changed', handleUserPresenseChanged);
      }
    };
  }, [data && data.exhibitorId, data && data.staffUserIds]);

  return (
    <>
      <Col className="title-represent">
        <h2 className="ae-heading4 m-0">{t(data && data.compRepresentativeTitle)}</h2>
      </Col>
      <AERepresentativeCard
        repsObj={isLoaded ? compRepresent : []}
        selectedSalesRepForChat={selectedSalesRepForChat}
        disableChat={!chatEnabled}
        showStatusIndicator={showStatusIndicator}
        getConnectTextByStatus={getConnectTextByStatus}
        load={load}
        connectWithUser={connectWithUser}
        eventData={eventData}
        loggedInUser={loggedInUser}
        NewMeetWeb={NewMeetWeb}
        handleUserForChat={handleUserForChat}
        users={users}
        IMAGE_URL={IMAGE_URL}
        cloudinary_name={cloudinary_name}
        exhibitorId={data && data.exhibitorId}
        setStatusData={statusData}
        chargebeePlanName={chargebeePlanName}
        eventDates={eventDates}
      />
    </>
  );
}

const mapDispatchToProps = {
  selectUserForChat,
  saveAutoGenerateLeads,
  handleUserStatusChange,
  selectSalesRepForChat,
  getCompanyRepresentatives,
  connectAttendee,
  getAllAttendeesDetails,
  doGetEventPlanConfig,
};
const mapStateToProps = (state) => ({
  attendeeDetails: selectorVirtualEventAttendeeDetails(state),
  compRepresentative: state?.exhibitor?.compRepresentative || [],
  compRepStatus: state?.exhibitor?.compRepStatus || {},
  eventData: getEventData(state),
  loggedInUser: getUserSession(state),
  selectedSalesRepForChat: getSelectedSalesRepForChat(state),
  userTicketTypeIds: getUserTicketTypeIds(state),
  virtualEventSettings: selectorVirtualEventSettings(state),
  ipLookupTimeZone: getIpLookUpTimeZone(state),
  eventTicketData: getPortalTicketSettings(state),
});
export default connect(mapStateToProps, mapDispatchToProps)(ConnectCloudWatch(CompRepresent));
