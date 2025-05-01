import Authentication from './clientLogic/Authentication.js';
import Session from './clientLogic/Session.js';
import User from './clientLogic/entities/User.js';
import Campaign from './clientLogic/entities/Campaign.js';
import Permission from './clientLogic/entities/Permission.js';
import CampaignUser from './clientLogic/entities/CampaignUser.js';
//import Role from './clientLogic/entities/Role.js';

export { Authentication, Session, User, Campaign, Permission, CampaignUser };

export default {
  Authentication,
  Session,
  User,
  Campaign,
  Permission,
  CampaignUser,
};
