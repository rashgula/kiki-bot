// KIKI Bot - Invite Create Event
const InviteTracker = require('../utils/inviteTracker.js');

module.exports = {
  name: 'inviteCreate',
  execute(invite, client) {
    try {
      InviteTracker.handleInviteCreate(invite);
    } catch (err) {
      console.error('[EVENT inviteCreate ERROR]', err.message);
    }
  }
};
