import Axios from 'axios';
import { API_URL } from "../config";


function authRequestInterceptor(config: any) {
    const user = localStorage.getItem('user');
    if (user) {
        config.headers.authorization = `${JSON.parse(user).token}`;
    }
    config.headers.Accept = 'application/json';
    return config;
}

export const axios = Axios.create({
    baseURL: API_URL,
});

axios.interceptors.request.use(authRequestInterceptor);
