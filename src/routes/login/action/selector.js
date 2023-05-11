import { createSelector } from 'reselect';
import get from 'lodash/get';

export const getUser = (state) => state.user;
export const getSession = (state) => state.session;
export const getExhibitor = (state) => state.exhibitor;
export const getUserData = createSelector(getUser, (data) => get(data, 'user_data'));
export const getUserId = createSelector(getUserData, (data) => get(data, 'userId'));
export const getUserSession = createSelector(getSession, (data) => get(data, 'user'));
export const isAuthenticated = createSelector(getSession, (data) => get(data, 'authenticated'));
export const getExpoProducts = createSelector(getExhibitor, (data) => get(data, 'expoProducts.data'));
