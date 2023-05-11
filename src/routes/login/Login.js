import { Col } from 'react-bootstrap';
import React from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import $ from 'jquery';
import get from 'lodash/get';
import {
  APP_ENV,
  GOOGLE_EVENTS_TRACKING_ID,
  GOOGLE_TRACKING_ID,
  serverUrl,
  imgUrl as IMG_URL,
  cloudinary_url as CLOUDINARYURL,
  ACCELEVENTS_DEFAULT_EVENT_ICON,
} from '../../clientConfig';
import {
  doLogin,
  doLoginWl,
  doSignUp,
  getRedirectUrl,
  storeRedirectPath,
  whiteLabelURL,
  doFacebookLoginAdmin,
  setFooterText,
  storeUserEmailForPasswordResetPage,
  getOktaConfigurationForWL,
  loginByOktaAccessToken,
} from '../event/action/index';
import { onFormSubmit, storeLoginData, storeToken } from './action/index';
import { getUserByUserKey } from '../myProfile/action/signup_action';
import Link from '../../components/Link/Link';
import LoginHeader from '../../components/LoginHeader/LoginHeader';
import IntercomWidget from '../../components/IntercomWidget';
import { createNewEventRegular } from '../admin/event/action';
import WithParams from '../../components/WrapperComponents/WithParams';
import LoginForm from '../../components/Widget/Okta/LoginForm';
import PopupModel from '../../components/PopupModal';
import SeoHelmet from '../../components/Layout/SeoHelmet';
import AEButton from '../../Core/Button/Button';
import AEFacebookLoginContainer from '../../Core/FacebookLoginContainer';
import AEGoogleLoginContainer from '../../Core/GoogleLoginContainer';
import AELinkedInLoginContainer from '../../Core/LinkedinLoginContainer';
import AEAppleLoginContainer from '../../Core/AppleLoginContainer';
import AECheckbox from '../../Core/Checkbox/Checkbox';
import AEInputField from '../../Core/Input';
import AESpinner from '../../Core/Spinner/Spinner';

import { getLocalStorage } from '../../components/Widget/Utility/Utility';

const baseDomainUrl =
  window &&
  window.location &&
  `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isValidData: false,
      email: null,
      password: null,
      loading: false,
      whiteLabelName: undefined,
      rememberMe: true,
      showErrorMessage: false,
      intercomActivated: false,
      showPopup: false,
      clientId: null,
      targetUrl: null,
      hideCreateEventButton: true,
      whiteLabelData: null,
    };
    this.showLoading = this.showLoading.bind(this);
    this.showSuccessMessage = this.showSuccessMessage.bind(this);
    this.showErrorMessage = this.showErrorMessage.bind(this);
  }

  async componentDidMount() {
    // this.hasFBCallback();
    const { layoutProps } = this.props;
    const url = window.location.href;
    const userType = url.includes('?userType=');
    const userKey = url.includes('?userKey=');
    const urlParams = new URLSearchParams(window.location.search);
    if (userType) {
      const userEmail = urlParams.get('userEmail');
      this.email.value = userEmail;
      this.emailValidateHandler();
    }
    if (userKey) {
      if (urlParams.has('userKey')) {
        const resp = await this.props.getUserByUserKey(urlParams.get('userKey'), urlParams.get('eventUrl'));
        if (resp && resp.data && resp.data.redirectUrl) {
          this.props.history.push(resp.data.redirectUrl);
        } else {
          window.location = url.substr(0, url.indexOf('?userKey'));
        }
      }
    }
    this.setInitState();

    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      // eslint-disable-next-line no-undef
      ga('create', GOOGLE_TRACKING_ID, 'auto');
      // eslint-disable-next-line no-undef
      ga('send', 'pageview');
    }
    const token = getLocalStorage('token');
    if (this.props.authenticated || token) {
      let whiteLabel = '';
      if (get(layoutProps, 'loginType') === 'whiteLabel') {
        whiteLabel = this.props.params && this.props.params.params;
      }
      if (!userType) {
        this.props.getRedirectUrl(whiteLabel).then((resp) => {
          if (resp && resp.redirectUrl) {
            window.location.href = resp.redirectUrl;
          } else {
            this.props.history.push('/u/superadmin/events');
          }
        });
      }
    }
  }

  componentDidUpdate() {
    // this.hasFBCallback();
    this.onLoginBtnEnable();
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      // eslint-disable-next-line no-undef
      ga('set', 'page', window.location.pathname);
      // eslint-disable-next-line no-undef
      ga('send', 'pageview');
    }
  }

  UNSAFE_componentWillMount() {
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      const userId = getLocalStorage('userId');
      // eslint-disable-next-line no-undef
      ga('create', GOOGLE_EVENTS_TRACKING_ID, 'auto', 'eventTracker');
      // eslint-disable-next-line no-undef
      ga('set', '&uid', userId);
      // eslint-disable-next-line no-undef
      ga('eventTracker.send', 'pageview');
    }
  }

  hasFBCallback = () => {
    const hasCallback = window.location && window.location.search;
    if (hasCallback && hasCallback !== '') {
      $('.login-wrap').addClass('hide');
      $('.host-footer').addClass('hide');
    }
  };

  setInitState = () => {
    const { layoutProps, params } = this.props;
    if (get(layoutProps, 'loginType') === 'whiteLabel') {
      this.props.whiteLabelURL(params && params.params).then((resp) => {
        if (resp && resp.errorCode === '4040201') {
          window.location.replace('/notFound');
        } else {
          this.props.setFooterText(resp && resp.footerText);
          this.setState({
            intercomActivated: resp && resp.intercomActivated,
            // fbAppId: (resp && resp.fbAppId) || undefined,
            whiteLabelName: resp && resp.firmName,
            hideCreateEventButton: resp && resp.hideCreateEventButton,
            intercomId: resp?.intercomId,
            whiteLabelData: resp || null,
          });
        }
      });
      this.props
        .getOktaConfigurationForWL(params && params.params)
        .then((resp) => {
          if (resp && resp.data) {
            const { clientId, targetUrl } = resp.data;
            this.setState({
              clientId,
              targetUrl,
            });
          }
        })
        .catch(() => {
          this.setState({
            clientId: null,
            targetUrl: null,
          });
        });
    } else {
      // this.setState({ fbAppId: appId });
      this.setState({ hideCreateEventButton: false });
      this.props.setFooterText('AccelEventsFooter');
    }
  };

  showLoading = () => {
    this.setState({
      loading: true,
    });
  };

  showSuccessMessage = () => {
    this.setState({
      loading: false,
    });
  };

  showErrorMessage = () => {
    this.setState({
      loading: false,
    });
  };

  togglePopup = (showPopup) => {
    this.setState({
      showPopup,
    });
  };

  onFormClick = (e) => {
    const { layoutProps } = this.props;
    e.preventDefault();
    let isValidEmailAndPassword = true;
    if (this.email.value && this.email.value.trim() === '') {
      isValidEmailAndPassword = false;
      this.setState({
        email: false,
      });
    }
    if (this.password.value && this.password.value.trim() === '') {
      isValidEmailAndPassword = false;
      this.setState({
        password: false,
      });
    }
    let { email } = this.state;
    if (!email && this.email.value && this.email.value.trim() !== '') {
      const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      email = re.test(this.email.value.trim());
      this.setState({ email });
    }
    if (email && this.password.value && isValidEmailAndPassword) {
      this.setState({ loading: true });
      if (get(layoutProps, 'loginType') === 'whiteLabel') {
        this.props
          .doLoginWl(
            this.email.value.trim(),
            this.password.value.trim(),
            this.state.rememberMe,
            this.props.params.params,
          )
          .then((resp) => {
            if (resp && resp.data) {
              this.setState({ message: 'Login Successful' });
              this.TempTimeout = setTimeout(() => {
                const url = window.location.href;
                const userType = url.includes('?userType=');
                if (userType) {
                  const urlParams = new URLSearchParams(window.location.search);
                  if (urlParams.has('userType')) {
                    urlParams.get('userType');
                    this.props.createNewEventRegular(this.props.params.params).then(() => {
                      window.location.replace(
                        `/host/eventsetup/${window.location.search}&whiteLabelUrl=${this.props.params.params}`,
                      );
                    });
                  }
                } else {
                  this.setState({ loading: false });
                  if (resp.data.redirectUrl === '/host/dashboard/home') {
                    window.location.replace(`/host/dashboard/home?whiteLabelUrl=${this.props.params.params}`);
                  } else {
                    window.location.replace(resp.data.redirectUrl);
                  }
                }
              }, 2000);
            } else if (resp && resp.errorCode === '4010102') {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: true,
                errorMessage: resp.errorMessage,
              });
            } else {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: resp && resp.errorCode === '4040100',
                showErrorMessage: false,
              });
            }
          });
      } else {
        let currentDomain = '';
        if (baseDomainUrl !== serverUrl) {
          currentDomain = baseDomainUrl;
        }
        this.props
          .doLogin(this.email.value.trim(), this.password.value.trim(), this.state.rememberMe, '', currentDomain)
          .then((resp) => {
            if (resp && resp.data) {
              if (APP_ENV === 'production' || APP_ENV === 'stage') {
                // eslint-disable-next-line no-undef
                ga('send', {
                  hitType: 'event',
                  eventCategory: 'Login',
                  eventAction: 'login',
                  eventLabel: 'Login Successful',
                });
                // eslint-disable-next-line no-undef
                ga('eventTracker.send', {
                  hitType: 'event',
                  eventCategory: 'Login',
                  eventAction: 'login',
                  eventLabel: 'Login Successful',
                });
              }
              this.setState({ message: 'Login Successful' });
              this.TempTimeout = setTimeout(() => {
                this.setState({ loading: false });
                if (this.userType) {
                  window.location.replace(`/host/eventsetup/home?whiteLabelUrl=${this.props.params.params}`);
                }
                window.location.replace(resp.data.redirectUrl);
              }, 2000);
            } else if (resp && resp.errorCode === '4010102') {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: false,
                showErrorMessage: true,
                errorMessage: resp.errorMessage,
              });
            } else {
              this.setState({
                hasError: true,
                loading: false,
                isExisting: resp && resp.errorCode === '4040100',
                showErrorMessage: false,
              });
            }
          });
      }
    }
  };

  redirectOnSignUp = () => {
    const { params, layoutProps } = this.props;
    if (get(layoutProps, 'loginType') === 'whiteLabel') {
      return `/u/wl-signup/${params && params.params}`;
    }
    return '/u/signup/';
  };

  emailValidateHandler = () => {
    this.setState({
      emailFeedBack: true,
    });
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (this.password.value && this.email.value.trim() === '') {
      this.setState({
        email: false,
      });
    } else {
      this.setState({
        email: re.test(this.email.value.trim()),
      });
    }
    this.setState({ isValidData: !!this.email.value });
  };

  passwordValidateHandler = () => {
    this.setState({
      passwordFeedBack: true,
    });

    const newPassword = `${this.password?.value || ''}`;
    if (newPassword.trim() === '') {
      this.setState({
        password: false,
        passwordValidationMessage: newPassword?.length === 0 ? 'Password can not be empty' : 'This value is not valid',
      });
    } else {
      this.setState({
        password: true,
      });
    }
    this.setState({ isValidData: !!this.email.value });
  };

  onLoginBtnEnable = () => {
    if (!this.state.isValidData && !!this.email.value) {
      this.setState({ isValidData: !!this.email.value });
    }
  };

  facebookLoginResponse = (response) => {
    if (response.accessToken && response.status !== 'not_authorized' && response.status !== 'unknown') {
      this.props.doFacebookLoginAdmin(response.accessToken).then((resp) => {
        if (resp && resp.data) {
          this.setState({ loading: false });
          window.location.replace(resp.data.redirectUrl);
        } else {
          this.setState({ hasError: true, loading: false });
        }
      });
    }
  };

  resetErrorMessages = () => {
    this.passwordValidateHandler();
    this.setState({
      isExisting: false,
      hasError: false,
    });
  };

  componentWillUnmount() {
    if (this.TempTimeout) {
      clearTimeout(this.TempTimeout);
      this.TempTimeout = null;
    }
  }

  getVovels = (letter) => {
    switch (letter.toLowerCase()) {
      case 'a':
        return 'an';
      case 'e':
        return 'an';
      case 'i':
        return 'an';
      case 'o':
        return 'an';
      case 'u':
        return 'an';
      default:
        return 'a';
    }
  };

  render() {
    const { params, layoutProps, whiteLabelURL } = this.props;
    const {
      clientId,
      targetUrl,
      whiteLabelName,
      hideCreateEventButton,
      email,
      emailFeedBack,
      intercomActivated,
      intercomId,
      whiteLabelData,
      passwordValidationMessage,
    } = this.state;
    return (
      <div className="login-wrap">
        {get(layoutProps, 'loginType') === 'generalLogin' ? (
          <SeoHelmet
            seoData={{
              faviconUrl: `${CLOUDINARYURL}/${IMG_URL}${ACCELEVENTS_DEFAULT_EVENT_ICON}`,
              description: `${
                whiteLabelName || 'Accelevents'
              } login page to sign in to your existing fundraising or event ticketing account`,
            }}
          />
        ) : null}
        <div className="login-signup-container login  has-cell-number login-center">
          <Col
            md={7}
            className={cx('form-padding login-fix-width login-fix-width-center', whiteLabelURL && 'max-width-100-perc')}
          >
            <LoginHeader whiteLabelUrl={this.props.params && this.props.params.params} />

            <div className="login-form" id="LoginAttempt ">
              <div className="text-center fullWidth" />
              {get(layoutProps, 'loginType') === 'whiteLabel' ? (
                <div className={cx('text-center', whiteLabelData ? 'visibility-visible' : 'visibility-hidden')}>
                  <h5 className="text-center">
                    {whiteLabelName ? (
                      `Log In To ${whiteLabelName}`
                    ) : (
                      <div className="text-center">
                        <h5>Log In To Accelevents</h5>
                      </div>
                    )}
                  </h5>
                </div>
              ) : (
                <div className="text-center">
                  <h5>Log In To Accelevents</h5>
                </div>
              )}
              <div className="text-center">
                <h4>{hideCreateEventButton ? '' : ' Or '}</h4>
              </div>
              {get(layoutProps, 'loginType') === 'whiteLabel' ? (
                !hideCreateEventButton && (
                  <h5 className="text-center">
                    {`Need ${this.getVovels(this.state.whiteLabelName ? this.state.whiteLabelName.charAt(0) : '')} `}
                    {this.state.whiteLabelName}
                    {`  account?`}
                    <Link to={this.props.params && `/u/wl-signup/${this.props.params.params}`} className="color-prime">
                      {` Create an account.`}
                    </Link>
                  </h5>
                )
              ) : (
                <h5 className="text-center">
                  {'Need a Accelevents account? '}
                  <Link to="/u/signup/" className="color-prime">
                    Create an account.
                  </Link>
                </h5>
              )}
              {this.state.hasError && this.state.showErrorMessage ? (
                <div
                  id="errormessage"
                  className="js-notification notification-signup mrg-t-md red"
                  dangerouslySetInnerHTML={{ __html: this.state.errorMessage }}
                />
              ) : (
                ''
              )}
              {this.state.hasError && !this.state.isExisting && !this.state.showErrorMessage ? (
                <div id="alertmessage" className="js-notification notification-signup mrg-t-md red">
                  Your password is incorrect, please try again
                </div>
              ) : (
                ''
              )}
              {this.state.hasError && this.state.isExisting ? (
                !hideCreateEventButton ? (
                  <div
                    id="alertmessage"
                    className={cx('js-notification notification-signup mrg-t-md red', whiteLabelURL && 'text-center')}
                  >
                    {"Looks like you don't have an account yet. Let's change that! "}
                    <Link
                      className="cursor"
                      onClick={() => {
                        this.props.storeUserEmailForPasswordResetPage(this?.email?.value?.trim());
                      }}
                      to={this.redirectOnSignUp()}
                      id="signUp"
                    >
                      Sign up for free
                    </Link>
                  </div>
                ) : (
                  <div
                    id="alertmessage"
                    className={cx(
                      'js-notification notification-signup mrg-t-md ',
                      whiteLabelURL && 'text-danger text-center',
                    )}
                  >
                    {whiteLabelName} {'does not allow to sign up new users'}
                  </div>
                )
              ) : (
                ''
              )}
              {this.state.message && (
                <div
                  className={cx(
                    'ajax-msg-box text-center mrg-b-lg',
                    !this.state.isError ? 'text-success' : 'text-danger',
                  )}
                >
                  {this.state.message}
                </div>
              )}
              {this.state.loading ? (
                <div className="ajax-msg-box text-center mrg-b-lg">
                  <AESpinner type="SpinnerSmall" />
                  <span className="resp-message">Please wait...</span>
                </div>
              ) : (
                ''
              )}
              <form
                className={cx('ajax-form  validated fv-form fv-form-bootstrap', whiteLabelURL && 'whiteLabel_Image')}
                onSubmit={this.onFormClick}
                autoComplete="off"
              >
                <div className="mrg-t-sm form-group">
                  <AEInputField
                    name="username"
                    id="loginEmail"
                    autoComplete="off"
                    placeHolder="Email"
                    type="text"
                    inputRef={(ref) => {
                      this.email = ref;
                    }}
                    onChange={this.resetErrorMessages}
                    onBlur={this.emailValidateHandler}
                    size="normal"
                    valid={emailFeedBack && email}
                    feedBackText={'Email is required.'}
                    isFeedBackShow={emailFeedBack && !email}
                    maxLength={75}
                  />
                </div>
                <div className="mrg-t-sm form-group">
                  <AEInputField
                    name="password"
                    placeHolder="Password"
                    id="inputLoginPassword"
                    type="password"
                    autoComplete="new-password"
                    inputRef={(ref) => {
                      this.password = ref;
                    }}
                    onChange={this.resetErrorMessages}
                    onBlur={this.passwordValidateHandler}
                    size="normal"
                    valid={this.state.passwordFeedBack && this.state.password}
                    feedBackText={passwordValidationMessage || 'This value is not valid'}
                    isFeedBackShow={this.state.passwordFeedBack && !this.state.password}
                  />
                </div>
                <div className="mrg-t-sm">
                  <AEButton type="submit" block disabled={!this.state.isValidData}>
                    Log in
                  </AEButton>
                </div>
                <div
                  id="facebookLoginContainer"
                  className="d-flex align-items-center justify-content-space-between my-3"
                >
                  <AEFacebookLoginContainer
                    fixWidth
                    id="fbLogin"
                    isFrom="Login"
                    fields="name,email,cell,other_phone"
                    whiteLabelName={whiteLabelName}
                  />
                  <AEGoogleLoginContainer isFrom={'Login'} />
                  <AELinkedInLoginContainer isFrom={'Login'} />
                  <AEAppleLoginContainer isFrom={'Login'} />
                </div>
                <div className="mrg-t-sm ">
                  <div className="form-group clearfix">
                    <AECheckbox
                      message={' Remember me'}
                      id="remember-me"
                      name="remember-me"
                      defaultChecked={this.state.rememberMe}
                      style={{ marginRight: 8 }}
                      onChange={(e) => {
                        this.setState({ rememberMe: e.target.checked });
                      }}
                    />
                    {get(layoutProps, 'loginType') === 'whiteLabel' ? (
                      <Link
                        className="pull-right text-sm"
                        onClick={() => {
                          this.props.storeRedirectPath(window.location.href);
                          this.props.storeUserEmailForPasswordResetPage(this?.email?.value?.trim());
                        }}
                        to={`/u/wl-password-reset/${params && params.params}`}
                        id="forgotPasswordLinkWL"
                      >
                        Forgot password?
                      </Link>
                    ) : (
                      <Link
                        className="pull-right text-sm"
                        onClick={() => {
                          this.props.storeRedirectPath(window.location.href);
                          this.props.storeUserEmailForPasswordResetPage(this?.email?.value?.trim());
                        }}
                        to="/u/password-reset"
                        id="forgotPasswordLink"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                </div>
              </form>
              {get(layoutProps, 'loginType') === 'whiteLabel' && clientId && targetUrl ? (
                <>
                  <div className="text-center m-b-20">
                    <h4> Or </h4>
                  </div>
                  <div className="mrg-t-sm">
                    <AEButton block variant="secondary" onClick={() => this.togglePopup(true)}>
                      Log in with okta
                    </AEButton>
                  </div>
                  <PopupModel
                    id="oktaLoginPopup"
                    showModal={this.state.showPopup}
                    headerText={<p>Log In To {whiteLabelName || 'Accelevents'}</p>}
                    modelBody=""
                    onCloseFunc={() => this.togglePopup(false)}
                  >
                    <div>
                      <LoginForm
                        issuer={targetUrl}
                        clientId={clientId}
                        loginByOktaAccessToken={this.props.loginByOktaAccessToken}
                        whiteLabelURL={params.params}
                      />
                    </div>
                  </PopupModel>
                </>
              ) : (
                ''
              )}
            </div>
          </Col>
        </div>

        {(get(layoutProps, 'loginType') === 'whiteLabel' ? intercomActivated : true) && (
          <IntercomWidget
            whiteLabelUrl={params?.params}
            intercomActivated={intercomActivated}
            intercomId={intercomId}
            unauthorised
          />
        )}
      </div>
    );
  }
}

const mapDispatchToProps = {
  onFormSubmit: () => onFormSubmit(),
  doLogin,
  doLoginWl: (email, password, rememberme, type) => doLoginWl(email, password, rememberme, type),
  doSignUp: (email, password) => doSignUp(email, password),
  storeLoginData: (data) => storeLoginData(data),
  storeToken: (data) => storeToken(data),
  whiteLabelURL: (url) => whiteLabelURL(url),
  getRedirectUrl: (whiteLabel) => getRedirectUrl(whiteLabel),
  storeRedirectPath: (url) => storeRedirectPath(url),
  doFacebookLoginAdmin: (token) => doFacebookLoginAdmin(token),
  setFooterText: (val) => setFooterText(val),
  getUserByUserKey: (userKey, eventUrl) => getUserByUserKey(userKey, eventUrl),
  createNewEventRegular,
  storeUserEmailForPasswordResetPage,
  getOktaConfigurationForWL,
  loginByOktaAccessToken,
};

const mapStateToProps = (state) => ({
  counter: state.counter,
  user: state.session && state.session.user,
  authenticated: state.session.authenticated,
});
export default connect(mapStateToProps, mapDispatchToProps)(WithParams(Login));
