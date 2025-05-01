class App {
  constructor(data) {
    this.name = data.name;
    this.url = data.url;
    this.disableDatetime = data.disableDatetime;
  }

  create() {}

  update() {}

  static async list({}, session) {
    try {
      /* return List of apps */
    } catch (err) {
      throw err;
    }
  }

  static async planList({ appId }, session) {
    try {
      /* return  List of plans by app */
    } catch (err) {
      throw err;
    }
  }

  static async campaignList({}, session) {
    try {
      /*List the campaigns by app*/
    } catch (err) {
      throw err;
    }
  }
}
