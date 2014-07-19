var hideMsgs = false;
var hideSnds = false;

// Get current product object 
// Execute only one of these statements. 
// The next line is commented out for testing.
// currentApp = Windows.ApplicationModel.Store.CurrentApp;

// The next line is commented out for production/release.
currentApp = Windows.ApplicationModel.Store.CurrentAppSimulator;

// We should have either a real or a simulated CurrentProduct object here.

// Get the license info
licenseInformation = currentApp.licenseInformation;

window.requestAnimationFrame(function () {
  new GameManager(3, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
