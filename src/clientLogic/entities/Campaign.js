import Permission from './Permission.js';
import CampaignUser from './CampaignUser.js';
class Campaign {
  #dataAdapter = null;
  #permissions = null;
  #session = null;

  constructor({ dataAdapter }, campaign, session) {
    if (!dataAdapter) throw new Error('dataAdapter is required');
    if (!campaign) throw new Error('campaign is required');

    this.#dataAdapter = dataAdapter;
    this.#session = session;

    this.id = campaign.id;
    this.name = campaign.name;
    this.campaignUserId = campaign.campaignUserId;
    this.campaignUserMetada = campaign.campaignUserMetada;
    this.defaultFacilityId = campaign.defaultFacilityId;
    this.defaultFacilityName = campaign.defaultFacilityName;
    this.defaultFacilityNickName = campaign.defaultFacilityNickName;
    this.defaultRoleId = campaign.defaultRoleId;
    this.defaultTaskProjectId = campaign.defaultTaskProjectId;
    this.employeeId = campaign.employeeId;
    this.isActive = campaign.isActive;
    this.isOwner = campaign.isOwner;
    this.isPrimary = campaign.isPrimary;
    this.parentCampaignId = campaign.parentCampaignId;
    this.#permissions = campaign?.permissions
      ? campaign.permissions.map(permission => new Permission(permission.toLowerCase().trim()))
      : [];
    //what is this?
    this.activeTimeLogId = campaign?.activeTimeLogId || null;
    this.isThisApp = campaign?.isThisApp || null;
  }

  /**
   * return the campaign permissions
   * @returns {Array} - The campaign permissions
   */
  getPermissions() {
    return this.#permissions;
  }

  /**
   * return the list of campaign roles
   * @returns {Array} - The campaign roles
   */
  async getRoles() {
    return await Campaign.roleList({ dataAdapter: this.#dataAdapter }, this.id, this.#session);
  }

  /**
   * Get the list of users in a campaign
   * @param {Object} filters
   * @param {String} filters.searchString - The search string to filter users
   * @param {String} filters.roleIdCsv - The role ID CSV to filter users
   * @param {Number} filters.includeInactiveCampaignUsers - Include inactive campaign users (default: 1)
   * @param {Number} filters.includeInactiveRoles - Include inactive roles (default: 1)
   * @param {String} filters.orderBy - The order by clause for sorting
   * @returns
   */
  async getUsers({
    searchString = null,
    roleIdCsv = null,
    includeInactiveCampaignUsers = 1,
    includeInactiveRoles = 1,
    orderBy = null,
  }) {
    const response = await CampaignUser.campaignUserList(
      { dataAdapter: this.#dataAdapter },
      {
        campaignId: this.id,
        searchString: searchString,
        roleIdCsv: roleIdCsv,
        includeInactiveCampaignUsers: includeInactiveCampaignUsers,
        includeInactiveRoles: includeInactiveRoles,
        rowCountSkip: 0,
        rowCountTake: 99999,
        orderBy: orderBy,
      },
      session
    );
    return response;
  }

  /**
   * Get the list of join requests for the campaign
   * @param {Object} filters
   * @param {String} filters.searchString - The search string to filter join requests
   * @param {String} filters.orderBy - The order by clause for sorting
   * @returns {Promise<Array>} - A promise that resolves to an array of join requests
   */
  async getJoinRequests({ searchString = null, orderBy = null }) {
    const response = await CampaignUser.campaignUserJoinList(
      { dataAdapter: this.#dataAdapter },
      {
        campaignId: this.id,
        searchString: searchString,
        orderBy: orderBy,
        joinTypeId: 2,
        joinStatusId: 1,
        rowCountSkip: 0,
        rowCountTake: 99999,
        orderBy: orderBy,
      },
      session
    );
    return response;
  }

  /**
   * Get the list of invitations sendded for the campaign
   * @param {Object} filters
   * @param {String} filters.searchString - The search string to filter invitations
   * @param {String} filters.orderBy - The order by clause for sorting
   * @returns {Promise<Array>} - A promise that resolves to an array of invitations
   */
  async getInvitations({ searchString = null, orderBy = null }) {
    const response = await CampaignUser.campaignUserJoinList(
      { dataAdapter: this.#dataAdapter },
      {
        campaignId: this.id,
        searchString: searchString,
        orderBy: orderBy,
        joinTypeId: 1,
        joinStatusId: 1,
        rowCountSkip: 0,
        rowCountTake: 99999,
        orderBy: orderBy,
      },
      session
    );
    return response;
  }

  /**
   * Check if the campaign has permissions
   * @param {Array} modulePermissions - The permissions array to check
   * @returns {Boolean} - True if the campaign has permissions, false otherwise
   */
  hasPermissions(modulePermissions = []) {
    if (!Array.isArray(modulePermissions) || modulePermissions.length < 0) {
      return false;
    }
    return this.#permissions.some(p => modulePermissions.some(mp => p.codeId.toLowerCase().trim() === mp.toLowerCase().trim()));
  }

  /**
   * Return the campaign object as a JSON object without permissions
   * @returns {Object} - The campaign object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      campaignUserId: this.campaignUserId,
      campaignUserMetada: this.campaignUserMetada,
      defaultFacilityId: this.defaultFacilityId,
      defaultFacilityName: this.defaultFacilityName,
      defaultFacilityNickName: this.defaultFacilityNickName,
      defaultRoleId: this.defaultRoleId,
      defaultTaskProjectId: this.defaultTaskProjectId,
      employeeId: this.employeeId,
      isActive: this.isActive,
      isOwner: this.isOwner,
      isPrimary: this.isPrimary,
      parentCampaignId: this.parentCampaignId,
      // what is this?
      activeTimeLogId: this.activeTimeLogId,
      isThisApp: this.isThisApp,
    };
  }

  /**   
    Take the list of roles from the campaign
    @param {Object} adapters
    @param {Object} adapters.dataAdapter - The data adapter instance
    @param {Object} params
    @param {string} params.campaignId - The ID of the campaign
    @param {Object} session - The current session instance of containing the auth token
    @returns {Promise<Array>} - A promise that resolves to an array of roles
  */
  static async roleList({ dataAdapter }, { campaignId }, session) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    await dataAdapter.fetch('roleList', { campaignId: campaignId }, session.auth.token);
    return response;
  }

  /**
    Create an invitation for a new user to join the campaign
    @param {Object} adapters
    @param {Object} adapters.dataAdapter - The data adapter instance
    @param {Object} invitation  - The invitation object containing the email and roleIdCSV
    @param {Object} session - The current session instance of containing the auth token
    @returns {Promise<Object>} - A promise that resolves of created invitation
  */
  async sendInvitation({ joinFirstName, joinLastName, employeeId, vendorId, roleIdCsv, joinEmail }, session) {
    if (!session) throw new Error('Session is required');
    const response = await CampaignUser.campaignUserJoinCreate(
      { dataAdapter: this.#dataAdapter },
      {
        campaignId: this.id,
        roleIdCsv: roleIdCsv,
        joinEmail: joinEmail,
        joinFirstName: joinFirstName,
        joinLastName: joinLastName,
        employeId: employeeId,
        vendorId: vendorId,
        joinTypeId: 1,
      },
      session
    );
    return response;
  }

  /**
    Update the status of an invitation
    @param {Object} adapters
    @param {Object} adapters.dataAdapter - The data adapter instance
    @param {Object} invitation - The invitation object containing the status and comments
    @param {Object} session - The current session instance of containing the auth token
    @returns {Promise<Object>} - A promise that resolves to an array of updated invitations
  */
  static async invitationUpdate({ dataAdapter }, invitation, session) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');
    const response = await CampaignUser.campaignUserJoinUpdate({ dataAdapter }, invitation, session);
    return response;
  }

  /**
   * Update the campaign data
   * @param {Object} adapters
   * @param {Object} adapters.dataAdapter - The data adapter instance
   * @param {Object} campaign - The campaign data to update
   * @param {Object} session - The current session instance of containing the auth token
   * @returns {Promise<Object>} - A promise that resolves to the updated campaign data
   */
  static async campaignUpdate({ dataAdapter }, campaign, session) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const response = await dataAdapter.fetch(
      'campaignUpdate',
      {
        campaignId: campaign.campaignId,
        name: campaign.name,
        shortName: campaign.shortName,
        imageFileId: campaign.imageFileId,
        campaignPurpose: campaign.campaignPurpose,
        marketVendorId: campaign.marketVendorId,
        timeZoneName: campaign.timeZoneName,
        wildcardSubdomain: campaign.wildcardSubdomain,
        facebookLink: campaign.facebookLink,
        instagramLink: campaign.instagramLink,
        twitterLink: campaign.twitterLink,
        pinterestLink: campaign.pinterestLink,
        writeNulls: campaign.writeNulls,
      },
      session.auth.token
    );
    return response;
  }

  /**
   * Get the list of roles and permission groups for a campaign
   * @param {Object} adapters
   * @param {Object} adapters.dataAdapter - The data adapter instance
   * @param {Object} filters - The filters to apply to the list
   * @param {String} filters.searchString - The search string to filter roles and permission groups
   * @param {String} filters.roleIdCsv - The role ID CSV to filter roles
   * @param {String} filters.permissionGroupIdCsv - The permission group ID CSV to filter permission groups
   * @param {Number} filters.rowCountSkip - The number of rows to skip (default: 0)
   * @param {Number} filters.rowCountTake - The number of rows to take (default: 99999)
   * @param {String} filters.orderBy - The order by clause for sorting
   * @param {Object} session - The current session instance of containing the auth token
   * @returns {Promise<Object>} - A promise that resolves to the list of roles and permission groups
   */
  static async campaignRoleAndPermissionGroupList({ dataAdapter }, filters, session) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const response = await dataAdapter.fetch(
      'campaignRoleAndPermissionGroupList',
      {
        campaignId: filters.campaignId,
        searchString: filters?.searchString || null,
        roleIdCsv: filters?.roleIdCsv || null,
        permissionGroupIdCsv: filters?.permissionGroupIdCsv || null,
        rowCountSkip: filters?.rowCountSkip || 0,
        rowCountTake: filters?.rowCountTake || 99999,
        orderBy: filters?.orderBy || null,
      },
      session.auth.token
    );
    return response;
  }
}

export default Campaign;
