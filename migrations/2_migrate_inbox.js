var IPFSInbox = artifacts.require("Inbox");
module.exports = function(deployer) {
    deployer.deploy(IPFSInbox);
};
