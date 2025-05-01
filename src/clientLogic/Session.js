import Authentication from './Authentication.js';
import SessionValidator from '../validations/Session/Session.validator.js';
class Session {
  static instance;
  #cacheAdapter = null;
  #authAdapter = null;
  #dataAdapter = null;
  #eventAdapter = null;
  #anonymous = null;
  #appToken = null;
  #validator = null;

  constructor({ cacheAdapter, authAdapter, dataAdapter, eventAdapter }, { anonymous, appToken }) {
    if (!cacheAdapter) throw new Error('cacheAdapter is required');
    if (!authAdapter) throw new Error('authAdapter is required');
    if (!dataAdapter) throw new Error('dataAdapter is required');
    if (!eventAdapter) throw new Error('eventAdapter is required');

    if (Session.instance) return Session.instance;

    this.#validator = new SessionValidator();
    this.#cacheAdapter = cacheAdapter;
    this.#authAdapter = authAdapter;
    this.#dataAdapter = dataAdapter;
    this.#eventAdapter = eventAdapter;
    this.#anonymous = anonymous;
    this.#appToken = appToken;
    this.details = null;

    this.auth = new Authentication(
      { cacheAdapter: this.#cacheAdapter, authAdapter: this.#authAdapter, dataAdapter: this.#dataAdapter },
      { appToken: this.#appToken },
      this
    );

    this.selectedCampaigns = [];
    this.selectedUserCampaignModeId = null;

    /*this.currentTimeLogId = null; what is this? */

    Session.instance = this;
  }

  async init() {
    const token = this.#cacheAdapter.get('token');
    const urlToken = this.#cacheAdapter.get('urlToken');
    const user = this.#cacheAdapter.get('user');

    if (token && this.#authAdapter.isValid(token) && urlToken && this.#authAdapter.isValid(urlToken) && user) {
      this.auth.setAuthentication({ token, urlToken, user });
      this.#setDetails(token);
      this.#initializeSessionData();
      return;
    }
    // If token is not found, needs to create an anonymous user
    await this.auth.login({
      username: this.#anonymous.username,
      password: this.#anonymous.password,
      lts: 0,
    });
    this.#setDetails(this.auth.token);
    return;
  }

  /**
   * Login the user with the username and password
   * @param {Object} params
   * @param {string} params.username - The username to login
   * @param {string} params.password - The password to login
   * @param {number} params.lts - The lts to login
   * @returns {Promise<void>} - Initializes the authentication data session
   */
  async login({ username, password, lts }) {
    this.#validator.validateLogin({ username, password });
    this.auth.logout(); //clean previous authentication session
    await this.auth.login({ username, password, lts });
    this.#setDetails(this.auth.token);
    this.#initializeSessionData();
    this.#saveSession();
    return;
  }

  /**
   * Call the server to create and send a email with the link for recovery
   * @param {Object} params
   * @param {string} params.username - The username to recover
   * @returns {Promise<Object>} - The server response with the recovery link
   */
  async recovery({ username }) {
    this.#validator.validateRecovery({ username });
    return await this.auth.recovery({ username });
  }

  /**
   * Call the server to create a new user account
   * @param {Object} params
   * @param {string} params.username - The username to register
   * @param {string} params.password - The password to register
   * @returns {Promise<Object>} - The server response with the status of the registration
   */
  async register({ username, password, confirmPassword }) {
    this.#validator.validateRegister({ username, password, confirmPassword });
    const response = await this.#dataAdapter.fetch(
      'userCreate',
      {
        username: username,
        password: password,
      },
      this.#appToken
    );
    return response;
  }

  /**
   * Update the user password, with the uuid sent by the email for recovery
   * @param {Object} params
   * @param {string} params.password - The new password to set
   * @param {string} params.confirmPassword - The confirmation password to set
   * @param {string} params.uuid - The uuid to identify the user
   * @returns {Promise<Object>} - The server response with the status of the password change
   */
  async changePassword({ password, confirmPassword, userRecoveryUuid = null }) {
    this.#validator.validateChangePassword({ password, confirmPassword, userRecoveryUuid });
    const response = this.#dataAdapter.fetch(
      'userPasswordUpdate',
      {
        passwordNew: password,
        userRecoveryUuid: userRecoveryUuid,
      },
      this.#appToken
    );
    return response;
  }

  /**
   * Refresh the authentication token and update the session data
   * @returns {Promise<void>} - Refreshes the authentication session
   */
  async refresh() {
    if (!this.auth.token) throw new Error('Token is required');
    await this.auth.refreshToken();
    this.#initializeSessionData();
    this.#saveSession();
    this.#eventAdapter.emit('session:refreshToken', { token: this.auth.token, urlToken: this.auth.urlToken });
    return;
  }

  /**
   * load the user current data
   * @returns {Promise<Object>} - Refreshes the authentication user current data with the selected campaigns
   */
  async loadUserCurrentData() {
    if (!this.auth.token) throw new Error('Token is required');
    const campaignIdCsv = this.selectedCampaigns.length > 0 ? this.selectedCampaigns.map(c => c.id).join(',') : null;
    await this.auth.user.loadCurrentData(campaignIdCsv);
    return this.auth.user.currentData;
  }

  /**
   * Logout the user and remove the session data
   * @returns {void} - Logs out the user
   */
  logout() {
    this.auth.logout();
    this.#removeSession();
    this.details = null;
    this.selectedCampaigns = [];
    this.selectedUserCampaignModeId = null;
    return;
    //removeLocalStorage('currentTimeLogId');
  }

  /**
   *
   * @param {Array} campaigns
   * @returns {void} - Sets the selected campaigns
   */
  setSelectedCampaigns(campaigns) {
    this.selectedCampaigns = campaigns;
    this.#cacheAdapter.set('selectedCampaigns', campaigns);
  }

  /**
   * Set the selected user campaign mode id
   * @param {Array} campaigns
   * @returns {void} - Sets the selected user campaign mode id
   */
  setSelectedUserCampaignModeId(modeId) {
    this.selectedUserCampaignModeId = modeId;
    this.#cacheAdapter.set('selectedUserCampaignModeId', id);
  }

  /**
   * Validate the permissions of the user for the selected campaigns
   * @param {Array[String]} modulePermissions - The permissions to validate codeIds : module.permission
   * @returns {boolean} - True if the user has the permissions, false otherwise
   */
  validatePermissions(modulePermissions = []) {
    return this.auth.user.validatePermissions({ modulePermissions, campaignIds: this.selectedCampaigns.map(c => c.id) });
  }

  /**
   * This method decodes the token and sets the session details
   * @param {String} token
   * @returns {void} - Sets the session details
   */
  #setDetails(token) {
    const tokenData = this.#authAdapter.decode(token);
    this.details = {
      appVersion: tokenData.appVersion,
      appId: tokenData.appId,
      ExpDate: tokenData.expDate,
      tokenExpTimestamp: tokenData.expTimestamp,
      lts: tokenData.lts,
    };
  }

  /**
   * This method initializes the session data
   * @returns {void} - Initializes the session data
   * @description This method sets the selected campaigns and the selected user campaign mode id
   * from the local storage or from the user data. If the selected campaigns are not found, it sets all campaigns
   */
  #initializeSessionData() {
    const selectedCampaigns = this.#cacheAdapter.get('selectedCampaigns') || [];
    this.selectedUserCampaignModeId =
      this.#cacheAdapter.get('selectedUserCampaignModeId') || this.auth.user.defaultCampaignModeId || null;
    /* Set selected campaigns from localStorage or set all campaigns from user */
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      this.selectedCampaigns = selectedCampaigns;
    } else {
      /*select campaigns by default campaign mode id*/
      if (this.selectedUserCampaignModeId) {
        const mode = this.auth.user.campaignModeList.find(mode => mode.id === this.auth.user.defaultCampaignModeId);
        if (mode) {
          const cpids = mode.campaignIdCsv.split(',').map(id => parseInt(id));
          this.selectedCampaigns = this.auth.user.campaigns.filter(cp => cpids.includes(cp.id)).map(cp => cp.toJSON());
        } else {
          this.selectedCampaigns = this.auth.user.campaigns.map(cp => cp.toJSON());
        }
      } else if (this.auth.user.defaultCampaignId) {
        /*select campaigns by default campaign id*/
        this.selectedCampaigns = this.auth.user.campaigns
          .filter(cp => cp.id === this.auth.user.defaultCampaignId)
          .map(cp => cp.toJSON());
      } else {
        this.selectedCampaigns = this.auth.user.campaigns.map(cp => cp.toJSON());
      }
    }
    //this.currentTimeLogId = this.#cacheAdapter.get('currentTimeLogId') || null;
  }

  /**
   * This method saves the session data to the local storage
   * @returns {void} - Saves the session data
   * @description This method saves the token, urlToken, user, selectedCampaigns and selectedUserCampaignModeId
   * to the local storage
   */
  #saveSession() {
    this.#cacheAdapter.set('token', this.auth.token);
    this.#cacheAdapter.set('urlToken', this.auth.urlToken);
    this.#cacheAdapter.set('user', this.auth.user.toJSON());
    this.#cacheAdapter.set('selectedCampaigns', this.selectedCampaigns);
    this.#cacheAdapter.set('selectedUserCampaignModeId', this.selectedUserCampaignModeId);
  }

  /**
   * This method removes the session data from the local storage
   * @returns {void} - Removes the session data
   * @description This method removes the token, urlToken, user, selectedCampaigns and selectedUserCampaignModeId
   * from the local storage
   */
  #removeSession() {
    this.#cacheAdapter.remove('token');
    this.#cacheAdapter.remove('urlToken');
    this.#cacheAdapter.remove('selectedCampaigns');
    this.#cacheAdapter.remove('selectedUserCampaignModeId');
    this.#cacheAdapter.remove('user');
  }
}

export default Session;
