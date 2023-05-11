import axios from 'axios';
import get from 'lodash/get';
import { apiUrl as API_URL } from '../../../clientConfig';
import FileDownload from '../../react-file-download/file-download';
import { STORE_AUDIENCE_COLUMN_MASTER_JSON, STORE_AUDIENCE_FILTER_MASTER_JSON } from '../../../constants';

export const columnMasterJsonSource = {
  AUDIENCE_FILTER: 'audience-filter',
  ATTENDEE_ANALYTICS: 'attendee-analytics',
};

export function storeAudienceFilterMasterJson(data) {
  return {
    type: STORE_AUDIENCE_FILTER_MASTER_JSON,
    data,
  };
}

export function storeAudienceColumnMasterJson(data) {
  return {
    type: STORE_AUDIENCE_COLUMN_MASTER_JSON,
    data,
  };
}

export function createFilter(data) {
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}u/audience/filter`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function updateFilter(data) {
  return () =>
    axios({
      method: 'put',
      url: `${API_URL}u/audience/filter`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getAudienceAllFilter(organizationURL = '') {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/organizer/${organizationURL}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getAudienceAllFilterByWhiteLabelURL(whiteLabelURL = '') {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/whitelabel/${whiteLabelURL}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getAudienceByFilter(organizationUrl = '', id = '', offset = 0, size = 1000, searchString = '', data) {
  let queryParam = `id=${id}&offset=${offset}&size=${size}&searchString=${searchString}`;
  if (data) {
    queryParam = `offset=${offset}&size=${size}&searchString=${searchString}`;
  }
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}u/audience/filter/organizer/${organizationUrl}/audienceWithColumnValues?${queryParam}`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getAudienceByFilterAndWhiteLabelURL(
  whiteLabelURL = '',
  id = '',
  offset = 0,
  size = 1000,
  searchString = '',
  data,
) {
  let queryParam = `id=${id}&offset=${offset}&size=${size}&searchString=${searchString}`;
  if (data) {
    queryParam = `offset=${offset}&size=${size}&searchString=${searchString}`;
  }
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}u/audience/filter/whitelabel/${whiteLabelURL}/audienceWithColumnValues?${queryParam}`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function deleteFilter(id) {
  return () =>
    axios({
      method: 'delete',
      url: `${API_URL}u/audience/filter/${id}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export async function getSuggestionByFilterTypeAndFieldAndValue(
  organizationUrl = '',
  filterType = '',
  field = '',
  value = '',
  instanceName = '',
  limit = 15,
) {
  return axios({
    method: 'get',
    url: `${API_URL}u/audience/filter/organizer/${organizationUrl}/referenceField?type=${filterType}&instance=${instanceName}&field=${field}&value=${value}&limit=${limit}`,
  })
    .then((resp) => {
      if (resp && resp.data) {
        return resp.data;
      }
      return resp;
    })
    .catch((error) => get(error, 'response.data'));
}

export async function getSuggestionByFilterTypeAndFieldAndValueAndWhiteLabelURL(
  whiteLabelURL = '',
  filterType = '',
  field = '',
  value = '',
  instanceName = '',
  limit = 15,
) {
  return axios({
    method: 'get',
    url: `${API_URL}u/audience/filter/whitelabel/${whiteLabelURL}/referenceField?type=${filterType}&instance=${instanceName}&field=${field}&value=${value}&limit=${limit}`,
  })
    .then((resp) => {
      if (resp && resp.data) {
        return resp.data;
      }
      return resp;
    })
    .catch((error) => get(error, 'response.data'));
}

export function getAudienceDownloadByFilterId(organizerURL, filterId, fileName) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/organizer/${organizerURL}/audienceFilter/CSV?id=${filterId}`,
      responseType: 'blob',
    })
      .then((resp) => {
        if (resp && resp.data) {
          FileDownload(resp.data, `${fileName}.csv`);
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getAudienceDownloadByFilterIdAndWhiteLabelURL(whiteLabelURL, filterId, fileName) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/whitelabel/${whiteLabelURL}/audienceFilter/CSV?id=${filterId}`,
      responseType: 'blob',
    })
      .then((resp) => {
        if (resp && resp.data) {
          FileDownload(resp.data, `${fileName}.csv`);
          return resp.data;
        }
        return resp;
      })
      .catch((error) => {
        get(error, 'response.data');
      });
}

export function getAudienceFilterMasterJson() {
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/filterJson`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          const audienceFilterJson = get(resp, 'data.audienceFilterJson');
          const data = audienceFilterJson && JSON.parse(audienceFilterJson);
          dispatch(storeAudienceFilterMasterJson(data));
          return data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getColumnMasterJson(columnMasterJsonSource) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}host/column-selection/area/${columnMasterJsonSource}/columns`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          resp.data.customiseColumns = JSON.parse(resp.data.customiseColumns);
          resp.data.defaultColumns = JSON.parse(resp.data.defaultColumns);
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getEventsUserAttendedByUserId(organizerUrl, attendeeId) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/organizer/${organizerUrl}/user/${attendeeId}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getEventsUserAttendedByUserIdAndWhiteLabelURL(whiteLabelURL, attendeeId) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/whitelabel/${whiteLabelURL}/user/${attendeeId}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getEventsForAudienceAndOrderByOrganizer(organizerURL, userId) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/organizer/${organizerURL}/user/${userId}/events`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getEventsForAudienceAndOrderByWhiteLabel(whitelabelURL, userId) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}u/audience/filter/whitelabel/${whitelabelURL}/user/${userId}/events`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => get(error, 'response.data'));
}

export function getAudienceSelectedColumnByOrganizerAndFilterId(organizationURL, filterId) {
  const param = filterId ? `?filterId=${filterId}` : '';
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}host/column-selection/organizer/${organizationURL}/area/audience-filter${param}`,
    })
      .then((resp) => resp)
      .catch((error) => error?.response?.data);
}

export function getAudienceSelectedColumnByWhitelabelAndFilterId(whiteLabelURL, filterId = '') {
  const param = filterId ? `?filterId=${filterId}` : '';
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}host/column-selection/whitelabel/${whiteLabelURL}/area/audience-filter${param}`,
    })
      .then((resp) => resp)
      .catch((error) => error?.response?.data);
}

export function createColumnSelectionByOrganizer(organizerURL, data) {
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}host/column-selection/organizer/${organizerURL}`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => error?.response?.data);
}

export function createColumnSelectionByWhitelabel(whitelabelURL, data) {
  return () =>
    axios({
      method: 'post',
      url: `${API_URL}host/column-selection/whitelabel/${whitelabelURL}`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => error?.response?.data);
}

export function updateColumnSelectionById(id, data) {
  return () =>
    axios({
      method: 'put',
      url: `${API_URL}host/column-selection/${id}`,
      data,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => error?.response?.data);
}
