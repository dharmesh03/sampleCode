import axios from 'axios';
import sortBy from 'lodash/sortBy';
import map from 'lodash/map';
import { Analytics } from 'aws-amplify';
import {
  apiUrl as API_URL,
  AWS_KINESIS_DATA_STREAM_NAME,
  AWS_KINESIS_FIREHOSE_NAME,
  AWS_KINESIS_VIDEO_ANALYTICS_STREAM_NAME,
  AWS_KINESIS_VIDEO_VIEWS_STREAM_NAME,
  AWS_KINESIS_EXPO_VISIT_COUNT,
  AWS_KINESIS_VIDEO_ANALYTICS_STREAM,
  AWS_KINESIS_DYNAMO_DB_STREAM,
  AWS_KINESIS_MEETING_ANALYTICS_STREAM,
} from '../../../clientConfig';
import { getDeviceType } from '../../../utils/common';
import FileDownload from '../../../components/react-file-download/file-download';
import { deviceType } from './userActivityEventConstant';

export function saveLeads(exhId, data, eventUrl = '') {
  const extUrl = data.leadId ? `/${data.leadId}` : '';
  return (dispatch) => {
    dispatch({ type: 'IS_SAVING_DATA' });
    return axios({
      method: data.leadId ? 'put' : 'post',
      url: `${API_URL}event/${eventUrl}/exhibitor/${exhId}/lead${extUrl}`,
      data,
    })
      .then((resp) => {
        dispatch({ type: 'SAVING_SUCCESS_OR_FAIL_LEADS_DATA' });
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => {
        dispatch({ type: 'SAVING_SUCCESS_OR_FAIL_TEAM_DATA' });
        return (error && error.response && error.response.data) || {};
      });
  };
}

export function saveAutoGenerateLeads(exhibitorId, eventId, isRequestedDemo, staffId = 0) {
  const requestedDemo = isRequestedDemo ? `?${isRequestedDemo}` : '';
  const staffParam = requestedDemo ? `&staffId=${staffId}` : `?staffId=${staffId}`;
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}event/${eventId}/exhibitor/${exhibitorId}/generate-auto-lead${requestedDemo}${staffParam}`,
    })
      .then((resp) => resp || {})
      .catch((error) => error?.response?.data || {});
}

export function deleteLeads(exhId, leadId, eventUrl = '') {
  return () =>
    axios({
      method: 'delete',
      url: `${API_URL}event/${eventUrl}/exhibitor/${exhId}/lead/${leadId}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function getLeads(exhId, page = 0, size = 10, searchString = '', eventUrl = '') {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/exhibitor/${exhId}/lead?page=${page}&size=${size}&searchString=${searchString}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function saveStaff(exhId, data, eventUrl = '') {
  const extUrl = data.id ? `/${data.id}` : '';
  return (dispatch) => {
    dispatch({ type: 'IS_SAVING_DATA' });

    return axios({
      method: data.id ? 'put' : 'post',
      url: `${API_URL}event/${eventUrl}/exhibitor/${exhId}/staff${extUrl}`,
      data,
    })
      .then((resp) => {
        dispatch({ type: 'SAVING_SUCCESS_OR_FAIL_TEAM_DATA' });
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => {
        dispatch({ type: 'SAVING_SUCCESS_OR_FAIL_TEAM_DATA' });
        return (error && error.response && error.response.data) || {};
      });
  };
}

export function deleteStaff(exhId, id, eventUrl = '') {
  return () =>
    axios({
      method: 'delete',
      url: `${API_URL}event/${eventUrl}/exhibitor/${exhId}/staff/${id}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function getStaff(exhId, page = 0, size = 100, searchString = '', eventUrl = '') {
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/exhibitor/${exhId}/staff?page=${page}&size=${size}&searchString=${searchString}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          dispatch({
            type: 'STORE_EXH_TEAM_DATA',
            data: resp.data,
          });
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function updateStaffAttendeeAccess(staffId, data, eventUrl = '') {
  let urlString = `${API_URL}events/${eventUrl}/staff/${staffId}/assignAttendeeAccessToExhibitorStaff?isAllowAttendeeAccess=${data.isAllowAttendeeAccess}&`;
  map(data.ticketTypeIds).forEach((element) => {
    urlString += `ticketTypeIds=${element}&`;
  });
  return () =>
    axios({
      method: 'put',
      url: urlString,
    })
      .then((resp) => resp)
      .catch((error) => error?.response?.data);
}

export function getCompanyRepresentatives(exhibitorId, evnetId) {
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}event/${evnetId}/exhibitor/${exhibitorId}/companyRepresentatives`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          dispatch({
            type: 'STORE_COMP_REPRESENTATIVE_DATA',
            data: resp.data,
          });
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function logExpoVisitedData(exhibitorId, evnetId) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}event/${evnetId}/exhibitor/${exhibitorId}/visit`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => error?.response?.data || {});
}

export function logExpoVisitorLeaveData(exhibitorId, evnetId) {
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}event/${evnetId}/exhibitor/${exhibitorId}/logLeaveData`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => error?.response?.data || {});
}

export function logDocumentDownloadData(exhibitorId, evnetId, documentName) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}event/${evnetId}/exhibitor/${exhibitorId}/document/${documentName}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => error?.response?.data || {});
}

export function logDocumentVisitLink(exhibitorId, evnetId, data) {
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}event/${evnetId}/exhibitor/${exhibitorId}/document`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => error?.response?.data || {});
}

export function storeExhibitorData(data) {
  return {
    type: 'STORE_EXHIBITOR_DATA',
    data,
  };
}

export function setExhibitorData(exhibitors) {
  return (dispatch) => dispatch(storeExhibitorData(exhibitors));
}

export function getEventExhibitor(
  eventUrl,
  exhibitorId = '',
  page = 0,
  size = 1000,
  searchString = '',
  categoryId = 0,
  isPaginated = false,
) {
  const url = exhibitorId ? `/${exhibitorId}` : `?page=${page}&size=${size}&searchString=${searchString}`;
  const categories = categoryId ? `/categories/${categoryId}` : '';
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/exhibitor${categories}${url}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          if (exhibitorId) {
            dispatch({ type: 'UPDATE_SINGLE_EXHIBITOR', data: resp.data });
          } else if (!isPaginated) {
            const { data } = resp.data;
            dispatch({ type: 'STORE_EXHIBITOR_DATA', data: sortBy(data, (data) => -data.position) });
          }
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function getEventExhibitorSummary(
  eventUrl,
  exhibitorId = '',
  page = 0,
  size = 1000,
  searchString = '',
  categoryId = 0,
  isPaginated = false,
) {
  const url = exhibitorId ? `/${exhibitorId}` : `/summary/?page=${page}&size=${size}&searchString=${searchString}`;
  const categories = categoryId ? `/categories/${categoryId}` : '';
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/exhibitor${categories}${url}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          if (exhibitorId) {
            dispatch({ type: 'UPDATE_SINGLE_EXHIBITOR', data: resp.data });
          } else if (!isPaginated) {
            const { data } = resp.data;
            dispatch({ type: 'STORE_EXHIBITOR_DATA', data: sortBy(data, (data) => -data.position) });
          }
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function getAllExhibitorsLogoForDisplay(eventUrl = '') {
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/exhibitor/logo`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          dispatch({ type: 'STORE_ALL_EXHIBITORS_LOGO', data: resp.data });
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => error?.response?.data || {});
}

export function getExhibitorEvents() {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}exhibitor/events`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function setEvent(exhId) {
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}exhibitor/setEvent/${exhId}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function selectUserForChat(data) {
  return (dispatch) => {
    dispatch({ type: 'SELECTED_USER_FOR_CHAT', data });
  };
}

export function resendInvitaionToExhibitorStaff(exhId, staffId, eventUrl = '') {
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}event/${eventUrl}/exhibitor/${exhId}/resendInvitation/staff/${staffId}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => (error && error.response && error.response.data) || {});
}

export function getExpoCategoryWithLeadDetails(id, searchString, isFromExhibitorSearch, page = 0, size = 1000) {
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}event/${id}/exhibitor/categories/exhibitorCountDetails?page=${page}&size=${size}&searchString=${searchString}&isFromExhibitorSearch=${isFromExhibitorSearch}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          const { data } = resp.data || {};
          dispatch({ type: 'FETCH_EXHIBITOR_CATEGORY', data });
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => error?.response?.data || {});
}

export function handleUserStatusChange(data) {
  return (dispatch) =>
    dispatch({
      type: 'STORE_COMP_REPRES_STATUS',
      data,
    });
}

export function doDownloadLeadsCSV(eventUrl, expoId) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/exhibitor/${expoId}/lead/download/lead/CSV`,
      responseType: 'blob',
    })
      .then((resp) => {
        if (resp && resp.data) {
          FileDownload(resp.data, 'Leads.csv');
          return resp.data;
        }
        return resp;
      })
      .catch((error) => error?.response?.data);
}

export function storeUserExpoVisitData(data) {
  return {
    type: 'STORE_USER_EXPO_VISIT_DETAILS',
    data,
  };
}

export function setUserExpoVisitData(userExpoVisitData) {
  return (dispatch) => dispatch(storeUserExpoVisitData(userExpoVisitData));
}
export function joinStreaming(exhibitorId, eventId) {
  return () =>
    axios({
      method: 'put',
      url: `${API_URL}event/${eventId}/exhibitor/${exhibitorId}/join`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => error?.response?.data);
}

export function storeExhibitorScrollData(data) {
  return {
    type: 'STORE_EXPO_SCROLL_DATA',
    data,
  };
}

export function setExpoScrollData(scrollData) {
  return (dispatch) => dispatch(storeExhibitorScrollData(scrollData));
}

export function isChimeMeetingStarted(eventId, exhibitorId) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventId}/exhibitor/${exhibitorId}/isMeetingStarted`,
    })
      .then((resp) => resp)
      .catch((error) => error?.response?.data || {});
}

export function getLeadOwners(id, eventUrl) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/exhibitor/${id}/leadOwners`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp || {};
      })
      .catch((error) => error?.response?.data || {});
}

export function addDataToKinesis(data, passDataToKinesisDataStream, videKinesisDataStream, expoData) {
  if (data) {
    if (videKinesisDataStream) {
      Analytics.record(
        {
          data,
          streamName: AWS_KINESIS_VIDEO_ANALYTICS_STREAM_NAME,
        },
        'AWSKinesisFirehose',
      );
    } else if (passDataToKinesisDataStream) {
      Analytics.record(
        {
          data,
          streamName: AWS_KINESIS_DATA_STREAM_NAME,
        },
        'AWSKinesis',
      );
    } else if (expoData) {
      Analytics.record(
        {
          data,
          streamName: AWS_KINESIS_EXPO_VISIT_COUNT,
        },
        'AWSKinesis',
      );
    } else {
      Analytics.record(
        {
          data,
          streamName: AWS_KINESIS_FIREHOSE_NAME,
        },
        'AWSKinesisFirehose',
      );
    }
  }
}

export function addDataToKinesisStream(data, stream) {
  if (data && stream) {
    switch (stream) {
      case AWS_KINESIS_VIDEO_VIEWS_STREAM_NAME:
        Analytics.record(
          {
            data,
            streamName: AWS_KINESIS_VIDEO_VIEWS_STREAM_NAME,
          },
          'AWSKinesisFirehose',
        );
        break;
      case AWS_KINESIS_VIDEO_ANALYTICS_STREAM_NAME:
        Analytics.record(
          {
            data,
            streamName: AWS_KINESIS_VIDEO_ANALYTICS_STREAM_NAME,
          },
          'AWSKinesisFirehose',
        );
        break;
      case AWS_KINESIS_MEETING_ANALYTICS_STREAM:
        Analytics.record(
          {
            data,
            streamName: AWS_KINESIS_MEETING_ANALYTICS_STREAM,
          },
          'AWSKinesis',
        );
        break;
      case AWS_KINESIS_VIDEO_ANALYTICS_STREAM:
        data = { ...data, source: deviceType[getDeviceType()] };
        Analytics.record(
          {
            data,
            streamName: AWS_KINESIS_VIDEO_ANALYTICS_STREAM,
          },
          'AWSKinesis',
        );
        break;
      default:
        break;
    }
  }
}

export async function addDataToKinesisDynamoDbStream(data) {
  if (data) {
    data = { ...data, source: deviceType[getDeviceType()], isToBeDisplayedInTimeline: true };
    Analytics.record(
      {
        data,
        streamName: AWS_KINESIS_DYNAMO_DB_STREAM,
      },
      'AWSKinesis',
    );
  }
}

export function getCurrentSystemDate() {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}/public/getCurrentDate`,
    }).then((resp) => {
      if (resp && resp.data) {
        return resp.data;
      }
      return resp;
    });
}

export function getAllAttendeesDetails(eventUrl, user_Id) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/people/getAttendeesDetails?userIds=${user_Id}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => error?.response?.data || {});
}
