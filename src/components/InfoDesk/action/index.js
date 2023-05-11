import axios from 'axios';
import { apiUrl as API_URL } from '../../../clientConfig';
import { createApiReqArray } from '../../../utils/common';

export function storeApiRequestInfo(data) {
  return {
    type: 'STORE_API_REQUEST_INFO',
    data,
  };
}

export function storeInfoDeskData(data) {
  return {
    type: 'STORE_INFO_DESK',
    data,
  };
}

export function getInfoDeskDetail(eventUrl) {
  return (dispatch) =>
    axios({
      method: 'get',
      url: `${API_URL}event/${eventUrl}/infoDesk`,
    })
      .then((resp) => {
        const newReqArr = createApiReqArray('InfoDesk', 'INFODESK');
        dispatch(storeApiRequestInfo(newReqArr));
        dispatch(storeInfoDeskData(resp?.data));
        return resp;
      })
      .catch((error) => error?.response?.data);
}

export function saveInfoDeskDetail(data, eventUrl = '') {
  return () =>
    axios({
      method: data.eventId ? 'put' : 'post',
      url: `${API_URL}event/${eventUrl}/infoDesk`,
      data,
    })
      .then((resp) => resp)
      .catch((error) => error?.response?.data);
}

export function deleteInfoDeskDetail(eventUrl) {
  return () =>
    axios({
      method: 'delete',
      url: `${API_URL}event/${eventUrl}/infoDesk`,
    })
      .then((resp) => resp)
      .catch((error) => error?.response?.data);
}
