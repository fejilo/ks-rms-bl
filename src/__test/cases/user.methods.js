import '../config.js';
import { Cache, Auth, Data, Event } from 'ks-adapters';
import Session from '../../clientLogic/Session.js';

(async () => {
  try {
    const cacheAdapter = new Cache('localStorage');
    const authAdapter = new Auth('JWT');
    const dataAdapter = new Data('mock');
    const eventAdapter = new Event('eventBus');

    const session = new Session(
      { cacheAdapter, authAdapter, dataAdapter, eventAdapter },
      { anonymous: { id: 10000, username: 'anonymous@kizansolutions.com', password: '123456' }, appToken: process.env.APP_JWT }
    );

    await session.login({
      username: 'user@kizansolutions.com',
      password: '123456',
      lts: true,
    });

    //await session.auth.user.loadCurrentData({});
    const response = await session.auth.user.updateDefaultCampaignModeId(10117);
    console.log('User data:', response);
  } catch (error) {
    console.log(error);
  }
})();
