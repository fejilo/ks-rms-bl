import User from './entities/User.js';
class Authentication {
  #authAdapter = null;
  #dataAdapter = null;
  #appToken = null;
  #session = null;

  constructor({ authAdapter, dataAdapter }, { appToken }, session) {
    if (!authAdapter) throw new Error('authAdapter is required');
    if (!dataAdapter) throw new Error('dataAdapter is required');

    this.#authAdapter = authAdapter;
    this.#dataAdapter = dataAdapter;
    this.#appToken = appToken;
    this.#session = session;

    this.token = null;
    this.urlToken = null;
    this.user = null;
    this.details = null;
  }

  /**
   * Login the user and set the token and user data
   * @param {Object} params
   * @param {string} params.username - The username to login
   * @param {string} params.password - The password to login
   * @param {number} params.lts - The lts to login
   * @returns {Promise<Object>} - The auth data
   */
  async login({ username, password, lts = 1 }) {
    if (!(username && password)) throw new Error('Invalid Username and/or Password');
    const response = await this.#dataAdapter.fetch(
      'userAuth',
      {
        //campaignId: 0,
        username: username.trim().toLowerCase(),
        password: password,
        lts: lts,
        //appVersion: process.env.APP_VERSION,
      },
      this.#appToken // token
    );
    this.setAuthentication(response);
    return { token: this.token, urlToken: this.urlToken, user: this.user };
  }

  /**
   * Call the server to create and send a email with the link for recovery
   * @param {Object} params
   * @param {string} params.username - The username to recover
   * @returns {Promise<Object>} - The server response with the recovery link
   */
  async recovery({ username }) {
    if (!username) throw new Error('Invalid Username');
    const response = await this.#dataAdapter.fetch(
      'userRecoveryCreate',
      {
        //campaignId: 0,
        username: username,
      },
      this.#appToken
    );
    return response;
  }

  /**
   * Logout the user and remove the token and user data
   * @returns {void}
   */
  logout() {
    this.token = null;
    this.urlToken = null;
    this.user = null;
  }

  /**
   * Verify if the user is authenticated
   * @returns {boolean} - True if the user is authenticated, false otherwise
   * @toDo
   * To DO: Review the way for now if the user is aithenticated or anonymous
   * is necesary add a aditional parameter in the token
   */
  isAuthenticated() {
    if (!this.token) return false;
    const tokenData = this.#authAdapter.decode(this.token);
    if (tokenData.expTimestamp < Date.now() / 1000) return false;
    if (tokenData.id !== this.user.id) return false;
    if (tokenData.id === 10000) return false;
    return true;
  }

  /**
   * Refresh the token and update the user data
   * @returns {Promise<Object>} - The auth data
   */
  async refreshToken() {
    if (!this.token) throw new Error('Token not found');
    try {
      const response = await this.#dataAdapter.fetch(
        'userAuth',
        {
          username: this.user.username,
          lts: this.#session.details.lts,
          //app_version: process.env.APP_VERSION,
        },
        this.token
      );
      this.setAuthentication(response);
      return { token: this.token, urlToken: this.urlToken, user: this.user };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Set the authentication data
   * @param {Object} authData - The auth data
   * @param {string} authData.token - The token to set
   * @param {string} authData.urlToken - The url token to set
   * @param {Object} authData.user - The user object to set
   */
  setAuthentication({ token, urlToken, user }) {
    const authData = this.#getAuthData({ token, urlToken, user });
    this.token = authData.token;
    this.urlToken = authData.urlToken;
    this.user = new User({ dataAdapter: this.#dataAdapter }, authData.user, this.#session);
  }

  /**
   * Return the auth data from the request and decode the token for the campaigns permissions
   * @param {Object} params
   * @param {string} params.token - The token to decode
   * @param {string} params.urlToken - The url token to decode
   * @param {Object} params.user - The user object to decode
   * @returns {Object} - The auth data
   */
  #getAuthData({ token, urlToken, user }) {
    const tokenData = this.#authAdapter.decode(token);
    const userCampaigns = [];
    let primaryCampaignId = null;

    tokenData.campaigns.forEach(campaign => {
      const cData = user.campaigns.find(c => c.id === campaign.id);
      if (cData) {
        if (cData.primary) {
          primaryCampaignId = cData.id;
          userCampaigns.unshift({ ...cData, permissions: campaign.permissions });
        } else {
          userCampaigns.push({ ...cData, permissions: campaign.permissions });
        }
      }
    });

    return {
      token: token,
      urlToken: urlToken,
      user: {
        ...user,
        campaigns: userCampaigns,
        defaultCampaignId: user.defaultCampaignId || primaryCampaignId,
      },
    };
  }
}

export default Authentication;
