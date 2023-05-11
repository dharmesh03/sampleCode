import axios from 'axios';
import { apiUrl as API_URL } from '../../../clientConfig';

function storeWhiteLabeInformation(data) {
  return {
    type: 'WHITE_LABEL_INFORMATION',
    data,
  };
}

export function setWhiteLabelInformation(data) {
  return (dispatch) => {
    dispatch(storeWhiteLabeInformation(data));
  };
}

export default function searchEvents(
  page = 0,
  size = 10,
  search = '',
  eventType = '',
  whiteLabelUrl = '',
  longitude = '',
  latitude = '',
  date = '',
  isFromToday = false,
  hostBaseUrl,
) {
  return () =>
    axios({
      method: 'get',
      url: `${API_URL}eventsearch?page=${page}&size=${size}&searchString=${search}&eventType=${eventType}&whiteLabelUrl=${whiteLabelUrl}&latitude=${latitude}&longitude=${longitude}&date=${date}&isFromToday=${isFromToday}${hostBaseUrl}`,
    })
      .then((resp) => {
        if (resp && resp.data) {
          return resp.data;
        }
        return resp;
      })
      .catch((error) => error?.response?.data);
}
