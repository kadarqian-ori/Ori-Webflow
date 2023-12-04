/* GLOBAL VARIABLES */
var auth0Client = null;
var user = null;
var isStaging = false;

var hasSetIntroDesignGuidelines = false;
var hasSetIntroFitGuidelines = false;
var hasSetSalesTestFit = false;
var hasSetSalesCaseStudies = false;
var hasSetBuildingChecklist = false;
var hasSetBuildingIntegration = false;

/* CONSTANTS */
const kInitalizedAuth0Client = "initalizedAuth0Client";
const kInitalizedAuth0User = "initalizedAuth0User";

// Channel Link attributes
const kChannelLinkAttribute = "channel-link";

const kIntroAttribute = "intro";
const kSalesAttribute = "sales";
const kInstallAttribute = "install";
const kLockInPriceAttribute = "lock-in-price";
const kReleaseToProductionAttribute = "release-to-production";
const kReleaseForShipmentAttribute = "release-for-shipment";
const kLeasingAttribute = "leasing";
const kManagementAttribute = "management";
const kMissingItemsAttribute = "pre-install";
const kChannelAttributes = [
    kIntroAttribute,
    kSalesAttribute,
    kInstallAttribute,
    kLockInPriceAttribute,
    kReleaseToProductionAttribute,
    kReleaseForShipmentAttribute,
    kLeasingAttribute,
    kManagementAttribute,
    kMissingItemsAttribute,
];

// Channel link states
const kActiveState = "active";
const kInactiveState = "inactive";
const kLockedState = "locked";
const kChannelStates = [
    kActiveState,
    kInactiveState,
    kLockedState
];

// API Permissions
const kPortalPermission = "access:portal";
const kInstallPermission = "access:install";
const kLeasingPermission = "access:leasing";
const kManagementPermission = "access:management";
const kPreInstallPermission = "access:pre-install";
const kSalesPermission = "access:sales";

const kReadSalesPermissions = "read:sales";
const kWriteSalesPermissions = "write:sales";
const kReadPreInstallPermissions = "read:pre-install";
const kWritePreInstallPermissions = "write:pre-install";
const kReadInstallPermissions = "read:install";
const kWriteInstallPermissions = "write:install";
const kReadLeasingPermissions = "read:leasing";
const kWriteLeasingPermissions = "write:leasing";
const kReadManagementPermissions = "read:management";
const kWriteManagementPermissions = "write:management";

const kAPIPermissions = [
    kPortalPermission,
    kReadSalesPermissions,
    kWriteSalesPermissions,
    kReadPreInstallPermissions,
    kWritePreInstallPermissions,
    kReadInstallPermissions,
    kWriteInstallPermissions,
    kReadLeasingPermissions,
    kWriteLeasingPermissions,
    kReadManagementPermissions,
    kWriteManagementPermissions,
];

// Pathnames
const kIntroPath = "/intro";
const kLoadingPath = "/loading";
const kSalesPath = "/sales";
const kPreInstallPath = "/pre-install";
const kInstallPath = "/install";
const kLeasingPath = "/leasing";
const kManagementPath = "/management";

// Used for Auth0
const config = {
    domain: "auth.oriliving.com",
    clientId: "bogwiGXt2q1sKSaqPIJb6xDFudGYYBaz",
};

const stagingConfig = {
    domain: "auth.oriliving.com",
    clientId: "tehgKlMBqihVuWZz12ZsOAvR3HUq0PuW",
}

const kDateFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
};

async function populateLefthandNavigation(cachedResponse) {
    // Not logged in, so lock all departments
    if (!cachedResponse) {
        setChannelStates([]);
        return;
    }

    const buildingName = cachedResponse.buildingName;
    setBuildingName(buildingName);

    // addItemToDropdown("buildingDropdown", buildingName, user.app_metadata?.buildingID);

    const permissions = cachedResponse.permissions;
    console.log("Setting channel states with permissions...", permissions);
    setChannelStates(permissions);
}

function setBuildingName(buildingName) {
    // buildingName
    const buildingNameTextField = document.getElementById("buildingName");
    if (buildingNameTextField) {
        buildingNameTextField.innerHTML = buildingName;
    }

    // mobile buildingName
    const buildingNameMobileTextField = document.getElementById("buildingNameMobile");
    if (buildingNameMobileTextField) {
        buildingNameMobileTextField.innerHTML = buildingName;
    }
}

function addItemToDropdown(dropdownId, text, value) {
    var dropdown = document.getElementById(dropdownId);

    if (!dropdown) {
        return;
    }

    // Create a new option element
    var option = document.createElement("option");

    // Set the text and value for the option
    option.text = text;
    option.value = value;

    // Append the option to the dropdown
    dropdown.appendChild(option);
}

function setChannelStates(permissions) {
    // get current site path
    const path = window.location.pathname;
    // depending on path and permissions, set and hide the kChannelAttributes hidden
    if (path == kIntroPath) {
        configureChannel(kIntroAttribute, permissions);
    } else if (path == kSalesPath) {
        configureChannel(kSalesAttribute, permissions);
    } else if (path == kLockInPriceAttribute) {
        configureChannel(kLockInPriceAttribute, permissions);
    } else if (path == kReleaseToProductionAttribute) {
        configureChannel(kReleaseToProductionAttribute, permissions);
    } else if (path == kReleaseForShipmentAttribute) {
        configureChannel(kReleaseForShipmentAttribute, permissions);
    } else if (path == kInstallPath) {
        configureChannel(kInstallAttribute, permissions);
    } else if (path == kLeasingPath) {
        configureChannel(kLeasingAttribute, permissions);
    } else if (path == kManagementPath) {
        configureChannel(kManagementAttribute, permissions);
    }

    // Pre-Install permission is deprecated – now Missing Items
    /*else if (path == kPreInstallPath) {
        configureChannel(kMissingItemsAttribute, permissions);
    }*/
}

function configureChannel(channelAttribute, permissions) {
    setChannelVisible(channelAttribute, kActiveState);
    setChannelHidden(channelAttribute, kInactiveState);
    setChannelHidden(channelAttribute, kLockedState);

    for (const attribute of kChannelAttributes) {
        if (attribute != channelAttribute) {
            const channelPermissions = permissionsWithChannel(attribute);
            if (attribute == kIntroAttribute || hasChannelPermission(permissions, channelPermissions)) {
                setChannelVisible(attribute, kInactiveState);
                setChannelHidden(attribute, kActiveState);
                setChannelHidden(attribute, kLockedState);
            } else {
                setChannelVisible(attribute, kLockedState);
                setChannelHidden(attribute, kActiveState);
                setChannelHidden(attribute, kInactiveState);
            }
        }
    }
}

function hasChannelPermission(permissions, channelPermissions) {
    for (const channelPermission of channelPermissions) {
        if (permissions.includes(channelPermission)) {
            return true;
        }
    }
    return false;
}

function setChannelVisible(channelAttribute, state) {
    const channelLink = document.querySelector(`[${kChannelLinkAttribute}="${channelAttribute}-${state}"]`);
    if (channelLink) {
        channelLink.style.display = "flex";
    }
}

function setChannelHidden(channelAttribute, state) {
    const channelLink = document.querySelector(`[${kChannelLinkAttribute}="${channelAttribute}-${state}"]`);
    if (channelLink) {
        channelLink.style.display = "none";
    }
}

function permissionsWithChannel(channelAttribute) {
    if (channelAttribute == kSalesAttribute ||  channelAttribute == kLockInPriceAttribute) {
        return [kReadSalesPermissions, kWriteSalesPermissions];
    } else if (channelAttribute == kMissingItemsAttribute) {
        return [kReadPreInstallPermissions, kWritePreInstallPermissions];
    } else if (channelAttribute == kInstallAttribute) {
        return [kReadInstallPermissions, kWriteInstallPermissions];
    } else if (channelAttribute == kLeasingAttribute) {
        return [kReadLeasingPermissions, kWriteLeasingPermissions];
    } else if (channelAttribute == kManagementAttribute) {
        return [kReadManagementPermissions, kWriteManagementPermissions];
    }
    return null;
}

const configureClient = async () => {
    attachListeners();
    if (window.location.href.toLowerCase().includes("webflow")) {
        console.log("Using staging config.");
        isStaging = true;
        auth0Client = await auth0.createAuth0Client({
            domain: stagingConfig.domain,
            clientId: stagingConfig.clientId
        });
    } else {
        console.log("Using prod config.");
        isStaging = false;
        auth0Client = await auth0.createAuth0Client({
            domain: config.domain,
            clientId: config.clientId
        });
    }
}

const initializeAuth0Promise = new Promise((resolve, reject) => {
    // Check if the variable is already initialized
    if (auth0Client) {
        resolve(auth0Client);
    } else {
        // Set up a listener for when the variable is initialized
        window.addEventListener(kInitalizedAuth0Client, () => {
            resolve(auth0Client);
        });
        if (auth0Client) {
            resolve(auth0Client);
        }
    }
});

const attachListeners = () => {
    const loginButton = document.getElementById("auth0-login");
    if (loginButton) {
        loginButton.addEventListener("click", login);
    }
}

const logoutButtons = document.querySelectorAll("[auth0-logout]");
if (logoutButtons) {
    logoutButtons.forEach(function (logoutButton) {
        logoutButton.addEventListener("click", () => logout());
    });
}

const login = async () => {
    localStorage.clear()

    try {
        await auth0Client.loginWithRedirect({
            authorizationParams: {
                redirect_uri: window.location.origin + "/loading"
            }
        });
    } catch (error) {
        console.error("Login failed with error:", error);
    }
}

const isLoggedOut = () => {
    const validLogoutPaths = [
        "/",
        "/access-denied",
    ];

    const currentLocation = window.location.pathname
    return validLogoutPaths.indexOf(currentLocation) > -1
}

const logout = (logoutPath = "/") => {
    localStorage.clear()

    if (!isLoggedOut()) {
        try {
            auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin + logoutPath
                }
            });
        } catch (error) {
            console.error("Failed to logout with error:", error);
        }
    }
}

const populateAuth0Element = (data, key, domAttribute = "innerText") => {
    const elements = document.body.querySelectorAll(`[data-auth0="${key}"]`);
    const elementsArray = Array.from(elements);
    elementsArray.map(element => {
        if (element) {
            element[domAttribute] = data[key];
        }
    });
}

function pageRequiresAuthentication() {
    const path = window.location.pathname;
    if (path == kSalesPath || path == kPreInstallPath || path == kInstallPath || path == kLeasingPath || path == kManagementPath) {
        return true;
    }
    return false;
}

function isIntroPage() {
    const path = window.location.pathname;
    return path == kIntroPath;
}

const logoutIfNotAuthenticated = async () => {
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (pageRequiresAuthentication() && !isAuthenticated) {
        logout();
    }
}

const handleAuth0 = async () => {
    await configureClient();

    const isAuthenticated = await auth0Client.isAuthenticated();

    const missingItemsContent = document.getElementById("missing-items-content");
    // Handling Intro page ad hoc
    if (logoutButtons && isIntroPage) {
        if (isAuthenticated) {
            logoutButtons.forEach(function (logoutButton) {
                logoutButton.innerText = "Log out";
            });
            if (missingItemsContent) {
                missingItemsContent.style.display = "block";
            }
        } else {
            logoutButtons.forEach(function (logoutButton) {
                logoutButton.style.display = "none";
            });
            if (missingItemsContent) {
                missingItemsContent.style.display = "block";
            }
        }
    }

    if (isAuthenticated) {
        if (!user) {
            user = await auth0Client.getUser();
        }
        //window.history.replaceState({ }, document.title, window.location.pathname);
        dispatchInitializationEvent();

        logoutIfNotAuthenticated();
        return;
    }

    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
        try {
            await auth0Client.handleRedirectCallback();

            user = await auth0Client.getUser();
            analytics.identify(user.sub, {
                "email": user.email,
                "role": user.role,
                "buildingID": user.app_metadata?.buildingID
            });

            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error("handleRedirectCallback failed with error:", error);
        }
    }

    dispatchInitializationEvent();
    logoutIfNotAuthenticated();
}

function dispatchInitializationEvent() {
    const event = new Event(kInitalizedAuth0Client);
    window.dispatchEvent(event);
}

var request = (async function () {
    const options = {
        authorizationParams:
        {
            audience: 'https://aws-portal-api.com',
            scope: 'openid profile email user_metadata picture',
        }
    }
    const token = await auth0Client.getTokenSilently(options);
    async function perform(urlPath) {
        try {
            let response = await axios.get(`https://vu8dd36vm1.execute-api.us-east-1.amazonaws.com/prod${urlPath}`, {
                params: {
                    buildingID: user.app_metadata.buildingID
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            return response;
        } catch (error) {
            console.error("Portal request failed with error:", error);
        }
    }
    return perform;
});

var postRequest = (async function () {
    const options = {
        authorizationParams:
        {
            audience: 'https://aws-portal-api.com',
            scope: 'openid profile email user_metadata picture',
        }
    }
    const token = await auth0Client.getTokenSilently(options);
    async function performPost(urlPath, postData) {
        try {
            let response = await axios.post(`https://vu8dd36vm1.execute-api.us-east-1.amazonaws.com/prod${urlPath}`, postData, {
                params: {
                    buildingID: user.app_metadata.buildingID
                },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                }
            });
            return response;
        } catch (error) {
            console.error("Portal post request failed with error:", error);
        }
    }
    return performPost;
});

async function createPostRequestPromise(requestPathName, postData) {
    return new Promise((resolve, reject) => {
        initializeAuth0Promise
            .then(auth0Client => {
                return postRequest();
            })
            .then(performRequest => {
                return performRequest(requestPathName, postData);
            })
            .then(response => {
                resolve(response);
            })
            .catch(error => {
                console.error(`Error fetching ${requestPathName} data: ${error}`);
                reject(error);
            });
    });
}

window.onload = async () => {
    var cachedResponse = localStorage.getItem("portalResponse");
    if (cachedResponse && cachedResponse.buildingName) {
        try {
            setBuildingName(cachedResponse.buildingName);
        } catch (error) {
            console.log("No name to set.");
        }
    }

    await handleAuth0();
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (isAuthenticated) {
        cachedResponse = await getPortalResponse();
    } else {
        if (isMobileDevice()) {
            login();
        }
    }
    if (window.location.pathname == kLoadingPath) {
        const redirectChannelPath = latestChannelPath(cachedResponse);
        if (isStaging) {
            window.location = `https://onboarding-portal-0746fa.webflow.io${redirectChannelPath}`;
        } else {
            window.location = `https://property.oriliving.com${redirectChannelPath}`;
        }
    } else {
        try {
            await populateLefthandNavigation(cachedResponse);
        } catch (error) {
            console.log("No lefthand navigation to populate.", error);
        }
    }
}

if (pageRequiresAuthentication()) {
    window.addEventListener('focus', function () {
        logoutIfNotAuthenticated();
    });
}

function latestChannelPath(cachedResponse) {
    if (isMobileDevice()) {
        return kInstallPath;
    } else {
        return kIntroPath;
    }

    // Old code that used to determine latest channel path
    // const permissions = cachedResponse.permissions;
    // var latestAttribute = kChannelAttributes[0];
    // for (const attribute of kChannelAttributes) {
    //     if (attribute == kIntroAttribute) {
    //         continue;
    //     }
    //     const channelPermissions = permissionsWithChannel(attribute);
    //     if (hasChannelPermission(permissions, channelPermissions)) {
    //         latestAttribute = attribute;
    //     }
    // }

    // return latestAttribute;
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

async function getPortalResponse() {
    var cachedResponse = localStorage.getItem("portalResponse");
    if (!cachedResponse) {
        const performRequest = await request();
        const portalResponse = await performRequest("/portal");
        localStorage.setItem("portalResponse", JSON.stringify(portalResponse.data));
    }
    cachedResponse = JSON.parse(localStorage.getItem("portalResponse"));
    return cachedResponse;
}

// Email
function popupEmailWindow(email, subject, body) {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const newWindow = window.open('', '_blank', 'width=800,height=800');
    newWindow.location.href = mailtoUrl;
}

// Metrics

/*{
    database: String
    page: Use Attributes defined in Constants
    tab: Defined below
    eventName: Defined per page
    userPayload
}*/
// Must be called after Auth0 initialization. Up to caller to enforce this.
function logEvent(page, tab, eventName) {
    if (!user) {
        return;
    }
    const userPayload = {
        userID: user.sub,
        email: user.email,
        buildingID: user.app_metadata?.buildingID,
        role: user.role,
    }
    const executePostRequest = createPostRequestPromise("/metrics", {
        database: "property-portal-metrics",
        page: page,
        tab: tab,
        eventName: eventName,
        userPayload: userPayload,
    });
    executePostRequest
        .then(response => {
            console.log("Logged event.", response);
        })
        .catch(error => {
            console.error("Error logging event:", error);
        })
}

// Metrics Constants (Prefixed with "km")

const kmIntroOriOverview = "OriOverview";
const kmIntroCaseStudies = "CaseStudies";
const kmIntroDesignGuidelines = "DesignGuidelines";
const kmIntroFitGuidelines = "FitGuidelines";

const kmSalesFitChecklist = "FitChecklist";
const kmSalesTestFit = "TestFit";
const kmSalesLockInPrice = "LockInPrice";

const kmPreInstallRFIs = "RFIs";
const kmPreInstallKnownRisks = "KnownRisks";
const kmPreInstallChangeOrders = "ChangeOrders";
const kmPreInstallReleaseToProduction = "ReleaseToProduction";

const kmInstallActiveInstall = "ActiveInstall";
const kmInstallNoticeOfCompletion = "NoticeOfCompletion";

const kmLeasingLeads = "Leads";
const kmLeasingAvailableUnits = "AvailableUnits";
const kmLeasingLeasedUnits = "LeasedUnits";
const kmLeasingLostLeads = "LostLeads";
const kmLeasingNotifyMeLeads = "NotifyMeLeads"

const kmManagementSystems = "Systems";
const kmManagementServiceCases = "ServiceCases";

const kmHelpResourceGetStarted = "GetStarted";
const kmHelpResourceResources = "Resources";
const kmHelpResourceContactOri = "ContactOri";

// Events (prefixed with kme)
// Types: "Clicked", "Viewed"
const kmTypeClicked = "Clicked";
const kmTypeViewed = "Viewed";

// Pre Install
const kmeRFIRespondClicked = kmTypeClicked + "RFIRespond";
const kmeRFILinkClicked = kmTypeClicked + "RFILink";
const kmeKnownRisksAcknowledgeClicked = kmTypeClicked + "KnownRisksAcknowledge";
const kmeKnownRisksLinkClicked = kmTypeClicked + "KnownRisksLink";
const kmeChangeOrdersSignClicked = kmTypeClicked + "ChangeOrdersSign";
const kmeChangeOrdersSignedLinkClicked = kmTypeClicked + "ChangeOrdersSignedLink";
const kmeReleaseToProductionButtonClicked = kmTypeClicked + "ReleaseToProductionButton";
const kmeReleaseToProductionLinkClicked = kmTypeClicked + "ReleaseToProductionLink";

// Install
const kmeInstallAssistantClicked = kmTypeClicked + "InstallAssistant";
const kmeInstallApproveInstall = kmTypeClicked + "InstallApproveButton";
const kmeInstallApproveInstallCancelClicked = kmTypeClicked + "InstallApproveFormCancelButton";
const kmeInstallApproveInstallSubmitClicked = kmTypeClicked + "InstallApproveFormSubmitButton";

// Leasing
const kmeLeadsContactClicked = kmTypeClicked + "LeadsContact";
const kmeLeadsLeasedClicked = kmTypeClicked + "LeadsLeased";
const kmeLeadsLeasedUnitClicked = kmTypeClicked + "LeadsLeasedUnit";
const kmeLeadsLeasedRentClicked = kmTypeClicked + "LeadsLeasedRent";
const kmeLeadsMoveInDateClicked = kmTypeClicked + "LeadsLeasedMoveInDate";
const kmeLeadsLeaseDurationClicked = kmTypeClicked + "LeadsLeasedDuration";
const kmeLeadsLeaseCancelClicked = kmTypeClicked + "LeadsLeasedCancel";
const kmeLeadsLeaseSubmitClicked = kmTypeClicked + "LeadsLeasedSubmit";
const kmeLeadsLostClicked = kmTypeClicked + "LeadsLost";
const kmeLeadsLostCancelClicked = kmTypeClicked + "LeadsLostCancel";
const kmeLeadsLostSubmitClicked = kmTypeClicked + "LeadsLostSubmit";

const kmeAvailableUnitsEditClicked = kmTypeClicked + "AvailableUnitsEdit";
const kmeAvailableUnitsRentClicked = kmTypeClicked + "AvailableUnitsRent";
const kmeAvailableUnitsPremiumClicked = kmTypeClicked + "AvailableUnitsPremium";
const kmeAvailableUnitsSquareFootageClicked = kmTypeClicked + "AvailableUnitsSquareFootage";
const kmeAvailableUnitsLeasedClicked = kmTypeClicked + "AvailableUnitsLeased";
const kmeAvailableUnitsAvailableClicked = kmTypeClicked + "AvailableUnitsAvailable";
const kmeAvailableUnitsOnHoldClicked = kmTypeClicked + "AvailableUnitsOnHold";
const kmeAvailableUnitsCancelClicked = kmTypeClicked + "AvailableUnitsCancel";
const kmeAvailableUnitsSubmitClicked = kmTypeClicked + "AvailableUnitsSubmit";

const kmeLeasedUnitsUpdateClicked = kmTypeClicked + "LeasedUnitsUpdate";

const kmeLostLeadsContactClicked = kmTypeClicked + "LostLeadsContact";
const kmeLostLeadsLeasedClicked = kmTypeClicked + "LostLeadsLeased";
const kmeLostLeadsLeasedUnitClicked = kmTypeClicked + "LostLeadsLeasedUnit";
const kmeLostLeadsLeasedRentClicked = kmTypeClicked + "LostLeadsLeasedRent";
const kmeLostLeadsMoveInDateClicked = kmTypeClicked + "LostLeadsLeasedMoveInDate";
const kmeLostLeadsLeaseDurationClicked = kmTypeClicked + "LostLeadsLeasedDuration";
const kmeLostLeadsLeaseCancelClicked = kmTypeClicked + "LostLeadsLeasedCancel";
const kmeLostLeadsLeaseSubmitClicked = kmTypeClicked + "LostLeadsLeasedSubmit";

// Management
const kmeSystemsGetHelpClicked = kmTypeClicked + "SystemsGetHelpButton";

// DEPRECATED
const kmSalesFitGuidelines = "FitGuidelines"; // use kmIntroFitGuidelines