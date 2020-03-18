'use strict';

/*global require,window */

var terriaOptions = {
    baseUrl: 'build/TerriaJS'
};

// checkBrowserCompatibility('ui');
import GoogleAnalytics from 'terriajs/lib/Core/GoogleAnalytics';
import ShareDataService from 'terriajs/lib/Models/ShareDataService';
import raiseErrorToUser from 'terriajs/lib/Models/raiseErrorToUser';
import registerAnalytics from 'terriajs/lib/Models/registerAnalytics';
import registerCatalogMembers from 'terriajs/lib/Models/registerCatalogMembers';
import registerCustomComponentTypes from 'terriajs/lib/ReactViews/Custom/registerCustomComponentTypes';
import Terria from 'terriajs/lib/Models/Terria';
import updateApplicationOnHashChange from 'terriajs/lib/ViewModels/updateApplicationOnHashChange';
import updateApplicationOnMessageFromParentWindow from 'terriajs/lib/ViewModels/updateApplicationOnMessageFromParentWindow';
import ViewState from 'terriajs/lib/ReactViewModels/ViewState';
import BingMapsSearchProviderViewModel from 'terriajs/lib/ViewModels/BingMapsSearchProviderViewModel.js';
import GazetteerSearchProviderViewModel from 'terriajs/lib/ViewModels/GazetteerSearchProviderViewModel.js';
import GnafSearchProviderViewModel from 'terriajs/lib/ViewModels/GnafSearchProviderViewModel.js';
import defined from 'terriajs-cesium/Source/Core/defined';
import render from './lib/Views/render';

/* BEGIN CUSTOM */
/* Add es translation */
import i18n from 'terriajs/lib/Models/i18n';
import translationES from "./lib/Language/es/translation.json";
import translationAppES from "./lib/Language/es/app.json";
import translationAppEN  from './lib/Language/en/app.json';

const defaultLanguage = 'es';
i18n.init({
    fallbackLng: defaultLanguage,
    lng: defaultLanguage
});
i18n.addResourceBundle('es', 'translation', translationES);
i18n.addResourceBundle('es', 'app', translationAppES);
i18n.addResourceBundle('en', 'app', translationAppEN);

import WebMapServiceCatalogItem from 'terriajs/lib/Models/WebMapServiceCatalogItem';
import BaseMapViewModel from 'terriajs/lib/ViewModels/BaseMapViewModel';
import applicationConfig from './application.json';
/* END CUSTOM */

// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
registerCatalogMembers();
registerAnalytics();

terriaOptions.analytics = new GoogleAnalytics();

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var terria = new Terria(terriaOptions);

// Register custom components in the core TerriaJS.  If you only want to register a subset of them, or to add your own,
// insert your custom version of the code in the registerCustomComponentTypes function here instead.
registerCustomComponentTypes(terria);

// Create the ViewState before terria.start so that errors have somewhere to go.
const viewState = new ViewState({
    terria: terria
});

if (process.env.NODE_ENV === "development") {
    window.viewState = viewState;
}

// If we're running in dev mode, disable the built style sheet as we'll be using the webpack style loader.
// Note that if the first stylesheet stops being nationalmap.css then this will have to change.
if (process.env.NODE_ENV !== "production" && module.hot) {
    document.styleSheets[0].disabled = true;
}

/* BEGIN CUSTOM */
function getMetadataValue(metadataValueKey) {
    var metadataEndpoint = applicationConfig.metadata.endpoint;
    return fetch(`${metadataEndpoint}/properties/${metadataValueKey}?_type=json`)
        .then(res => res.json())
        .then(jsonResponse => jsonResponse.value);
}
getMetadataValue(applicationConfig.metadata.navbarPathKey)
    .then(value => fetch(value))
    .then(res => res.text())
    .then(resText => {
        document.querySelector('#istac-navbar-container').innerHTML = resText;
    })
    .catch(console.error);

getMetadataValue(applicationConfig.metadata.footerPathKey)
    .then(value => fetch(value))
    .then(res => res.text())
    .then(resText => {
        document.querySelector('#istac-footer-container').innerHTML = resText;
    })
    .catch(console.error);
/* END CUSTOM */

module.exports = terria.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json',
    shareDataService: new ShareDataService({
        terria: terria
    })
}).otherwise(function(e) {
    raiseErrorToUser(terria, e);
}).always(function() {
    try {
        viewState.searchState.locationSearchProviders = [
            new BingMapsSearchProviderViewModel({
                terria: terria,
                key: terria.configParameters.bingMapsKey
            }),
            /* BEGIN CUSTOM */
            //new GazetteerSearchProviderViewModel({terria}),
            //new GnafSearchProviderViewModel({terria})
            /* END CUSTOM */
        ];

        // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
        updateApplicationOnHashChange(terria, window);
        updateApplicationOnMessageFromParentWindow(terria, window);

        // Create the various base map options.
        var createAustraliaBaseMapOptions = require('terriajs/lib/ViewModels/createAustraliaBaseMapOptions');
        var createGlobalBaseMapOptions = require('terriajs/lib/ViewModels/createGlobalBaseMapOptions');
        var selectBaseMap = require('terriajs/lib/ViewModels/selectBaseMap');

        var australiaBaseMaps = createAustraliaBaseMapOptions(terria);
        var globalBaseMaps = createGlobalBaseMapOptions(terria, terria.configParameters.bingMapsKey);

        /* BEGIN CUSTOM */
        var customBaseMaps = applicationConfig.baseMaps.map(function(baseMapconfig) {
            var customBaseMap = new WebMapServiceCatalogItem(terria);
            customBaseMap.name = baseMapconfig.name;
            customBaseMap.layers = baseMapconfig.layers;
            customBaseMap.url = baseMapconfig.url;
            customBaseMap.opacity = baseMapconfig.opacity || 1.0;
            customBaseMap.parameters = {
                format: baseMapconfig.format || 'image/png'
            }
            return new BaseMapViewModel({
                image: baseMapconfig.image,
                catalogItem: customBaseMap,
            });
        });
        
        var allBaseMaps = customBaseMaps.concat(globalBaseMaps);
        var excludedBasesMapNames = ['Australian Topography', 'Natural Earth II', 'NASA Black Marble'];
        var baseMapsCustomData = [
            {
                name: 'Bing Maps Aerial with Labels',
                image: 'images/bing-maps-aerial-labels.png'
            },
            {
                name: 'Bing Maps Aerial',
                image: 'images/bing-maps-aerial.png'
            },
            {
                name: 'Bing Maps Roads',
                image: 'images/bing-maps-roads.png'
            },
            {
                name: 'Positron (Light)',
                image: 'images/positron-light.png'
            },
            {
                name: 'Dark Matter',
                image: 'images/dark-matter.png'
            }
        ]
        allBaseMaps = allBaseMaps
            .filter(baseMap => !excludedBasesMapNames.some(excludedBasesMapName => baseMap.catalogItem.name == excludedBasesMapName))
            .map(baseMap => {
                var data = baseMapsCustomData.find(baseMapData => baseMapData.name == baseMap.catalogItem.name);
                if (data && data.image) {
                    baseMap.image = data.image;
                }
                return baseMap;
            });

        /* END CUSTOM */
        selectBaseMap(terria, allBaseMaps, 'Bing Maps Aerial with Labels', true);

        // Show a modal disclaimer before user can do anything else.
        if (defined(terria.configParameters.globalDisclaimer)) {
            var globalDisclaimer = terria.configParameters.globalDisclaimer;
            var hostname = window.location.hostname;
            if (globalDisclaimer.enableOnLocalhost || hostname.indexOf('localhost') === -1) {
                var message = '';
                // Sometimes we want to show a preamble if the user is viewing a site other than the official production instance.
                // This can be expressed as a devHostRegex ("any site starting with staging.") or a negative prodHostRegex ("any site not ending in .gov.au")
                if (defined(globalDisclaimer.devHostRegex) && hostname.match(globalDisclaimer.devHostRegex) ||
                    defined(globalDisclaimer.prodHostRegex) && !hostname.match(globalDisclaimer.prodHostRegex)) {
                        message += require('./lib/Views/DevelopmentDisclaimerPreamble.html');
                }
                message += require('./lib/Views/GlobalDisclaimer.html');

                var options = {
                    title: (globalDisclaimer.title !== undefined) ? globalDisclaimer.title : 'Warning',
                    confirmText: (globalDisclaimer.buttonTitle || "Ok"),
                    width: 600,
                    height: 550,
                    message: message,
                    horizontalPadding : 100
                };
                viewState.notifications.push(options);
            }
        }

        // Update the ViewState based on Terria config parameters.
        // Note: won't do anything unless terriajs version is >7.9.0
        if (defined(viewState.afterTerriaStarted)) {
            viewState.afterTerriaStarted();
        }

        render(terria, allBaseMaps, viewState);
    } catch (e) {
        console.error(e);
        console.error(e.stack);
    }
});
