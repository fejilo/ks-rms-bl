import Campaign from './Campaign.js';
import UserValidator from '../../validations/User/User.validator.js';

class User {
  #dataAdapter = null;
  #session = null;
  #validator = null;

  constructor({ dataAdapter }, user, session) {
    if (!dataAdapter) throw new Error('dataAdapter is required');
    if (!user) throw new Error('user is required');

    this.#dataAdapter = dataAdapter;
    this.#session = session;

    this.#validator = new UserValidator();
    this.id = user.id;
    this.username = user.username;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.imageFileId = user.imageFileId;
    this.defaultCampaignId = user.defaultCampaignId; //primary Campaign
    this.defaultCampaignModeId = user.defaultCampaignModeId;

    this.dataproviderDefaultModes = user?.dataproviderDefaultModes || [];
    this.campaigns = user?.campaigns ? user.campaigns.map(campaign => new Campaign({ dataAdapter }, campaign, session)) : [];
    this.campaignInvitationList = user?.campaignInvitationList || [];
    this.currentData = user?.currentData || {};
    this.campaignModeList = user?.campaignModeList || [];

    //this.singleCampaignMode = user.singleCampaignMode; //what is this?
  }

  get nestedCampaigns() {
    return this.#buildCampaignNested(this.campaigns);
  }

  getCampaigns() {
    return this.campaigns;
  }

  #buildCampaignNested(campaigns, parentCampaignId = null) {
    const nestedCampaigns = [];

    const childrens = campaigns.filter(
      campaign =>
        campaign.parentCampaignId === parentCampaignId ||
        (parentCampaignId === null && !campaigns.some(c => c.id === campaign.parentCampaignId))
    );

    for (const child of childrens) {
      const nestedChildrens = this.#buildCampaignNested(campaigns, child.id);
      child.campaigns = nestedChildrens;
      nestedCampaigns.push(child);
    }

    return nestedCampaigns;
  }

  getCampaignById(campaignId) {
    if (!campaignId) return;
    return this.campaigns.find(campaign => campaign.id === campaignId);
  }

  isOwner(campaignId) {
    if (!campaignId) return false;
    const campaign = this.getCampaign(campaignId);
    return campaign.isOwner;
  }

  isPrimaryCampaign(campaignId) {
    if (!campaignId) return false;
    const campaign = this.getCampaign(campaignId);
    return campaign.isPrimary;
  }

  validatePermissions({ modulePermissions = [], campaignIds = null }) {
    if (!Array.isArray(modulePermissions) || modulePermissions.length == 0) return false;
    if (Array.isArray(campaignIds) && campaignIds.length > 0) {
      const filteredCampaigns = this.campaigns.filter(c => campaignIds.includes(c.id));
      return filteredCampaigns.some(campaign => campaign.hasPermissions(modulePermissions));
    } else {
      return this.campaigns.some(campaign => campaign.hasPermissions(modulePermissions));
    }
  }

  /**
   * Return a JSON representation of the user object
   * @returns {Object} - A JSON object containing the user data
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      imageFileId: this.imageFileId,
      defaultCampaignId: this.defaultCampaignId,
      defaultCampaignModeId: this.defaultCampaignModeId,
      dataproviderDefaultModes: this.dataproviderDefaultModes,
      campaigns: this.campaigns.map(c => c.toJSON()),
      campaignInvitationList: this.campaignInvitationList,
      currentData: this.currentData,
      campaignModeList: this.campaignModeList,
    };
  }

  /**
   * load the current data for the user
   * @param {string} campaignIdCsv - A comma-separated list of campaign IDs
   * @returns {Promise<void>} - A promise that resolves when the current data is set
   */
  async loadCurrentData(campaignIdCsv = null) {
    const response = await this.#dataAdapter.fetch(
      'userCurrentDataRead',
      { campaignId: campaignIdCsv ? campaignIdCsv : this.campaigns.map(c => c.id).join(',') },
      this.#session.auth.token
    );
    this.currentData = response;
    return response;
  }

  /**
   * Set the campaign invitation list for the user
   * @returns {Promise<void>} - A promise that resolves when the campaign invitation list is set
   */
  async loadCampaignModeList() {
    const response = await this.#dataAdapter.fetch(
      'userCampaignModeList',
      {
        //campaignId: -1,
        rowCountSkip: 0,
        rowCountTake: 999,
      },
      this.#session.auth.token
    );
    this.campaignModeList = response;
    return response;
  }

  /**
   * Create a new user campaign mode
   * @param {Object} params
   * @param {string} params.campaignModeName - The name of the campaign mode
   * @param {string} params.campaignIdCsv - A comma-separated list of campaign IDs
   * @returns {Promise<object>} - A promise that resolves to the response/result from the server of the new campaign mode
   */
  async createCampaignMode({ campaignModeName, campaignIdCsv }) {
    this.#validator.validateCreateCampaignMode({ campaignModeName, campaignIdCsv });
    const response = await this.#dataAdapter.fetch(
      'userCampaignModeCreate',
      {
        campaignId: this.defaultCampaignId,
        campaignModeName: campaignModeName,
        campaignIdCsv: campaignIdCsv,
      },
      this.#session.auth.token
    );
    this.campaignModeList.push(response);
    return response;
  }

  /**
   * Delete a user campaign mode
   *  @param {Integer} campaignModeId - The ID of the campaign mode to delete
   *  @returns {Promise<object>} - A promise that resolves to the response/result from the server of the deleted campaign mode
   * */
  async deleteCampaignMode(campaignModeId) {
    if (!campaignModeId) throw new Error('Campaign mode ID is required');
    const response = await this.#dataAdapter.fetch(
      'userCampaignModeDelete',
      {
        campaignModeId: campaignModeId,
      },
      this.#session.auth.token
    );
    this.campaignModeList = this.campaignModeList.filter(c => c.id !== campaignModeId);
    return response;
  }

  /**
   * Change the password for the user
   * @param {Object} params
   * @param {String} params.passwordNew - The new password for the user
   * @param {String} params.passwordOld - The old password for the user
   * @returns {Promise<object>} - A promise that resolves to the response from the server
   */
  async changePassword({ password, confirmPassword, passwordOld = null }) {
    this.#validator.validateChangePassword({ password, confirmPassword });
    const response = dataAdapter.fetch(
      'userPasswordUpdate',
      {
        passwordNew: password,
        passwordOld: passwordOld, //this should be optional not has sense take the old password
        username: this.username, //optional?
      },
      session.auth.token
    );
    return response;
  }

  /**
   * Set the default campaign ID for the user
   * @param {Integer} campaignModeId  - The ID of the campaign mode to set as default
   * @returns {Promise<void>} - A promise that resolves to the response from the server
   */
  async updateDefaultCampaignModeId(campaignModeId) {
    if (!campaignModeId) throw new Error('Campaign mode ID is required');
    const response = await User.userUpdate(
      { dataAdapter: this.#dataAdapter },
      {
        userId: this.id,
        defaultCampaignModeId: campaignModeId,
        writeNulls: 0,
      },
      this.#session
    );
    this.defaultCampaignModeId = campaignModeId;
    return response;
  }

  /**
   * Set the default campaign ID for the user
   * @param {Integer} campaignId  - The ID of the campaign to set as default
   * @returns {Promise<void>} - A promise that resolves to the response from the server
   */
  async updateImageFileId(imageFileId) {
    if (!imageFileId) throw new Error('Image file ID is required');
    const response = await User.userUpdate(
      { dataAdapter: this.#dataAdapter },
      {
        userId: this.id,
        imageFileId: imageFileId,
        writeNulls: 0,
      },
      this.#session
    );
    this.imageFileId = imageFileId;
    return response;
  }

  /**
   * Update the user data
   * @returns {Promise<object>} - A promise that resolves to the response from the server
   */
  async update() {
    return await User.userUpdate(
      { dataAdapter: this.#dataAdapter },
      {
        userId: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        imageFileId: this.imageFileId,
        defaultCampaignModeId: this.defaultCampaignModeId,
        writeNulls: 0,
      },
      this.#session
    );
  }

  /** 
    Update the password for a user
    @param {Object} adapters  
    @param {Object} adapters.dataAdapter - The data adapter to use for the request
    @param {Object} params
    @param {Object} session - The current session instance of containing the auth token
    @returns {Promise<object>} - A promise that resolves to the response from the server
  */
  static async userCreate({ dataAdapter }, { username, password, firstName, lastName, imageFileId, imageFileUrl }, session) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const validator = new UserValidator();
    validator.validateUserCreate({ username, password, firstName, lastName, imageFileId });

    const response = await dataAdapter.fetch(
      'userCreate',
      {
        username: username,
        password: password,
        firstName: firstName,
        lastName: lastName,
        imageFileId: imageFileId,
        //imageFileUrl: imageFileUrl,
      },
      session.auth.token
    );
    return response;
  }

  /**
    update the user data
    @param {Object} adapters
    @param {Object} adapters.dataAdapter - The data adapter to use for the request
    @param {Object} params
    @param {string} params.firstName - The first name of the user
    @param {string} params.lastName - The last name of the user
    @param {string} params.imageFileUri - The URI of the image file
    @param {Integer} params.imageFileId - The ID of the image file
    @param {Object} session - The current session instance of containing the auth token
    @returns {Promise<void>} - A promise that resolves when the user data is updated
  */
  static async userUpdate(
    { dataAdapter },
    { userId, firstName, lastName, imageFileId, defaultCampaignModeId, writeNulls = 0 },
    session
  ) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');
    const validator = new UserValidator();
    validator.validateUserUpdate({ userId, firstName, lastName, imageFileId, defaultCampaignModeId });
    const response = await dataAdapter.fetch(
      'userUpdate',
      {
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        imageFileId: imageFileId,
        defaultCampaignModeId: defaultCampaignModeId,
        writeNulls: writeNulls,
      },
      session.auth.token
    );
    return response;
  }
}

export default User;
