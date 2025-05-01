class CampaignUser {
  constructor() {}
  /**
   * Get the list of users in a campaign
   * @param {Object} adapters
   * @param {Object} adapters.dataAdapter - The data adapter instance
   * @param {Object} params
   * @param {object} session - The current session instance of containing the auth token
   * @returns {Promise<Object>} - A promise that resolves to an array of users
   */
  static async campaignUserList(
    { dataAdapter },
    {
      campaignId,
      searchString = null,
      roleIdCsv = null,
      includeInactiveCampaignUsers = 1,
      includeInactiveRoles = 1,
      rowCountSkip = 0,
      rowCountTake = 9999,
      orderBy = null,
    },
    session
  ) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const response = await dataAdapter.fetch(
      'campaignUserList',
      {
        campaignId: campaignId,
        searchString: searchString,
        roleIdCsv: roleIdCsv,
        includeInactiveCampaignUsers: includeInactiveCampaignUsers,
        includeInactiveRoles: includeInactiveRoles,
        rowCountSkip: rowCountSkip,
        rowCountTake: rowCountTake,
        orderBy: orderBy,
      },
      session.auth.token
    );
    return response;
  }

  /** 
    Enable and disable roles for a user in a campaign
    @param {Object} adapters
    @param {Object} adapters.dataAdapter - The data adapter to use for the request
    @param {Object} params
    @param {string} params.campaignId - The ID of the campaign
    @param {string} params.campaignUserId - The ID of the campaign user
    @param {Array} params.roleIdCsvEnable - An array of role IDs to enable
    @param {Array} params.roleIdCsvDisable - An array of role IDs to disable
    @param {Object} session - The current session instance of containing the auth token
    @returns {Promise<void>} - A promise that resolves when the user roles are upserted
  */
  static async campaignUserRoleUpsert(
    { dataAdapter },
    { campaignId, campaignUserId, roleIdCsvEnable = null, roleIdCsvDisable = null },
    session
  ) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const response = await dataAdapter.fetch(
      'campaignUserRoleUpsert',
      {
        campaignId: campaignId,
        campaignUserId: campaignUserId,
        roleIdCsvEnable: roleIdCsvEnable,
        roleIdCsvDisable: roleIdCsvDisable,
      },
      session.auth.token
    );
    return response;
  }

  /**
   * Get the list of users who have joined a campaign
   * @param {Object} adapters
   * @param {Object} adapters.dataAdapter - The data adapter instance
   * @param {Object} params
   * @param {Object} session - The current session instance of containing the auth token
   */
  static async campaignUserJoinList(
    { dataAdapter },
    {
      campaignId,
      searchString = null,
      joinUserId = null,
      joinTypeId = null,
      joinStatusId = null,
      rowCountSkip = 0,
      rowCountTake = 9999,
      orderBy = null,
    },
    session
  ) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const response = await dataAdapter.fetch(
      'campaignUserJoinList',
      {
        campaignId: campaignId,
        searchString: searchString,
        joinUserId: joinUserId,
        joinTypeId: joinTypeId,
        joinStatusId: joinStatusId,
        rowCountSkip: rowCountSkip,
        rowCountTake: rowCountTake,
        orderBy: orderBy,
      },
      session.auth.token
    );

    return response;
  }

  /**
    Create an invitation for a new user to join the campaign
    @param {Object} adapters
    @param {Object} adapters.dataAdapter - The data adapter instance
    @param {Object} params
    @param {string} params.campaignId - The ID of the campaign
    @param {object} params.invitation - The invitation object containing user details
    @param {object} session - The current session instance of containing the auth token
    @returns {Promise<Object>} - A promise that resolves of created invitation
  */
  static async campaignUserJoinCreate({ dataAdapter }, data, session) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const response = await dataAdapter.fetch(
      'campaignUserJoinCreate',
      {
        campaignId: data.campaignId,
        inviterApproverUserId: session.auth.user.id, //id of the user who invited?
        roleIdCsv: data.roleIdCsv,
        joinEmail: data.email,
        joinFirstName: data.firstName,
        joinLastName: data.lastName,
        employeId: data.employeeId,
        vendorId: data.vendorId,
        joinTypeId: data?.joinTypeId || 1,
        joinStatusId: data?.joinStatusId || 1,
      },
      session.auth.token
    );

    return response;
  }

  /**
    Update the status of an invitation
    @param {Object} adapters
    @param {Object} adapters.dataAdapter - The data adapter instance
    @param {Object} params
    @param {string} params.campaignId - The ID of the campaign
    @param {object} params.invitation - The invitation object containing the status and comments
    @param {object} session - The current session instance of containing the auth token
    @returns {Promise<Object>} - A promise that resolves to an array of updated invitations
  */
  static async campaignUserJoinUpdate({ dataAdapter }, data, session) {
    if (!dataAdapter) throw new Error('Data adapter is required');
    if (!session) throw new Error('Session is required');

    const response = await dataAdapter.fetch(
      'campaignUserJoinUpdate',
      {
        campaignId: data.campaignId,
        campaignUserJoinId: data.campaignUserJoinId,
        joinStatusId: data.joinStatusId, // 1=sended, 2=accepted, 3=rejected => review the valid status ids
        comments: data.comments && data.comments.length > 0 ? data.comments : null,
        writeNulls: 0, //how to write nulls (continues using writeNulls)?
      },
      session.auth.token
    );
    return response;
  }
}

export default CampaignUser;
