import axios from 'axios';
import { apiUrl as API_URL } from '../../../clientConfig';
import { setLocalStorage } from '../../../components/Widget/Utility/Utility';

export function onFormSubmit() {
  return false;
}
export function storeLoginData(data) {
  return {
    type: 'STORE_LOGIN_DATA',
    data,
  };
}
export function storeToken(data) {
  return {
    type: 'STORE_TOKEN',
    token: data,
  };
}
export function doLogin(email, password) {
  return (dispatch) =>
    axios({
      method: 'post',
      url: `${API_URL}u/login`,
      data: {
        username: email,
        password,
      },
    })
      .then((response) => {
        dispatch(storeToken(response.data.access_token));
        // eslint-disable-next-line no-undef
        getUserDetails(response.data.access_token).then((resp) => {
          dispatch(storeLoginData(resp.data));
          setLocalStorage('user', resp.data);
        });
        setLocalStorage('token', response.data.access_token);
        setLocalStorage('userId', response.data.userId);
        return response;
      })
      .catch((error) => error);
}
