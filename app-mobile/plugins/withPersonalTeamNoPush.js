/**
 * I team Apple personali non possono firmare con Push Notifications (aps-environment).
 * Questo plugin toglie l'entitlement aggiunto da expo-notifications, così
 * Xcode builda con il team free. Le push remote restano disabilitate finché
 * non si passa a un Apple Developer Program a pagamento.
 *
 * Deve stare PRIMA di "expo-notifications" in app.json (i mod girano al contrario).
 */
const { withEntitlementsPlist } = require('@expo/config-plugins');

function withPersonalTeamNoPush(config) {
  return withEntitlementsPlist(config, (cfg) => {
    if (cfg.modResults && 'aps-environment' in cfg.modResults) {
      delete cfg.modResults['aps-environment'];
    }
    return cfg;
  });
}

module.exports = withPersonalTeamNoPush;
