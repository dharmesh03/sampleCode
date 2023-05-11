import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { ApolloProvider } from 'react-apollo';
import { I18nextProvider } from 'react-i18next';
import configureStore from './store/configureStore';
import * as serviceWorker from './serviceWorker';
import App from './components/App';
import client from './components/WrapperComponents/WithProvider';
import i18n from './translation/i18n';

const store = configureStore();

ReactDOM.render(
  <I18nextProvider i18n={i18n}>
    <ApolloProvider client={client}>
      <Provider store={store}>
        <App />
      </Provider>
    </ApolloProvider>
  </I18nextProvider>,
  document.getElementById('app'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
