import { STATE } from "../state";

export const updateMsg = (accountTreeView: any) => {
    if (STATE.currentAccount === undefined && STATE.currentNetwork !== undefined) {
        accountTreeView.message = `${"No Account selected"} | ${STATE.currentNetwork}`;
      } else if (STATE.currentAccount !== undefined && STATE.currentNetwork === undefined) {
        accountTreeView.message = `${STATE.currentAccount} | ${"No Network selected"}`;
      } else if (STATE.currentAccount === undefined && STATE.currentNetwork === undefined) {
        accountTreeView.message = `"No Account or Network selected`;
      } else {
        accountTreeView.message = `${STATE.currentAccount} | ${STATE.currentNetwork}`;
      }
};