console.log("begin");
/* GLOBAL VARIABLES */
var auth0Client = null;
var user = null;
var isStaging = false;

var hasSetIntroDesignGuidelines = false;
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
const kPreInstallAttribute = "pre-install";
const kInstallAttribute = "install";
const kLeasingAttribute = "leasing";
const kManagementAttribute = "management"
const kChannelAttributes = [
    kIntroAttribute,
    kSalesAttribute,
    kPreInstallAttribute,
    kInstallAttribute,
    kLeasingAttribute,
    kManagementAttribute
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

    console.log("Setting permissions...");
    const permissions = cachedResponse.permissions;
    setChannelStates(permissions);
}

function setBuildingName(buildingName) {
    // buildingName
    const buildingNameTextField = document.getElementById("buildingName");
    buildingNameTextField.innerHTML = buildingName;
}

function setChannelStates(permissions) {
    // get current site path
    const path = window.location.pathname;
    // depending on path and permissions, set and hide the kChannelAttributes hidden
    if (path == kIntroPath) {
        configureChannel(kIntroAttribute, permissions);
    } else if (path == kSalesPath) {
        configureChannel(kSalesAttribute, permissions);
    } else if (path == kPreInstallPath) {
        configureChannel(kPreInstallAttribute, permissions);
    } else if (path == kInstallPath) {
        configureChannel(kInstallAttribute, permissions);
    } else if (path == kLeasingPath) {
        configureChannel(kLeasingAttribute, permissions);
    } else if (path == kManagementPath) {
        configureChannel(kManagementAttribute, permissions);
    }
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
    if (channelAttribute == kSalesAttribute) {
        return [kReadSalesPermissions, kWriteSalesPermissions];
    } else if (channelAttribute == kPreInstallAttribute) {
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

const logoutButton = document.querySelector("[auth0-logout]");
if (logoutButton) {
    logoutButton.addEventListener("click", () => logout());
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

    // Handling Intro page ad hoc
    if (logoutButton && isIntroPage) {
        if (isAuthenticated) {
            logoutButton.innerText = "Log out";
        } else {
            logoutButton.style.display = "none";
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
            console.error("Portal patch request failed with error:", error);
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
    }
    if (window.location.pathname == kLoadingPath) {
        const redirectChannelPath = latestChannelPath(cachedResponse);
        if (isStaging) {
            window.location = `https://onboarding-portal-0746fa.webflow.io/${redirectChannelPath}`;
        } else {
            window.location = `https://property.oriliving.com/${redirectChannelPath}`;
        }
    } else {
        try {
            await populateLefthandNavigation(cachedResponse);
        } catch (error) {
            console.log("No lefthand navigation to populate.");
        }
    }
}

if (pageRequiresAuthentication()) {
    window.addEventListener('focus', function () {
        logoutIfNotAuthenticated();
    });
}

function latestChannelPath(cachedResponse) {
    const permissions = cachedResponse.permissions;
    var latestAttribute = kChannelAttributes[0];
    for (const attribute of kChannelAttributes) {
        if (attribute == kIntroAttribute) {
            continue;
        }
        const channelPermissions = permissionsWithChannel(attribute);
        if (hasChannelPermission(permissions, channelPermissions)) {
            latestAttribute = attribute;
        }
    }

    return latestAttribute;
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