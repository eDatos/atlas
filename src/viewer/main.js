"use strict";

/*global require,$,URI*/

var start = true;

var PopupMessage = require('./PopupMessage');
var FeatureDetection = require('../../third_party/cesium/Source/Core/FeatureDetection');

// If we're not in a normal browser environment (Web Worker maybe?), do nothing.
if (typeof window === 'undefined') {
    start = false;
} else {
    if (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 9) {
        var oldBrowserMessage = new PopupMessage({
            container : document.body,
            title : 'Internet Explorer 8 or earlier detected',
            message : '\
    National Map requires Internet Explorer 9 or later.  For the best experience, we recommend \
    <a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
    <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
    <a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        });

        start = false;
    }
}

if (start) {
    // IE9 doesn't have a console object until the debugging tools are opened.
    if (typeof window.console === 'undefined') {
        window.console = {
            log : function() {}
        };
    }

    window.CESIUM_BASE_URL = 'build/Cesium/';

    var copyright = require('../CopyrightModule');

    var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
    var SvgPathBindingHandler = require('../../third_party/cesium/Source/Widgets/SvgPathBindingHandler');
    var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
    var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
    var when = require('../../third_party/cesium/Source/ThirdParty/when');

    var AusGlobeViewer = require('./AusGlobeViewer');
    var corsProxy = require('../Core/corsProxy');
    var ApplicationViewModel = require('../ViewModels/ApplicationViewModel');
    var CatalogViewModel = require('../ViewModels/CatalogViewModel');
    var KnockoutSanitizedHtmlBinding = require('./KnockoutSanitizedHtmlBinding');
    var PopupMessage = require('./PopupMessage');
    var NowViewingViewModel = require('../ViewModels/NowViewingViewModel');
    var registerCatalogViewModels = require('../ViewModels/registerCatalogViewModels');

    SvgPathBindingHandler.register(knockout);
    KnockoutSanitizedHtmlBinding.register(knockout);
    registerCatalogViewModels();

    var application = new ApplicationViewModel();

    application.error.addEventListener(function(e) {
        var message = new PopupMessage({
            container : document.body,
            title: e.title,
            message: e.message
        });
    });

    var url = window.location;
    var uri = new URI(url);
    var params = uri.search(true);

    var configUrl = params.config || 'config.json';

    //get the server config to know how to handle urls and load initial one
    application.catalog.isLoading = true;
    loadJson(configUrl).then( function(config) {
        // IE versions prior to 10 don't support CORS, so always use the proxy.
        var alwaysUseProxy = (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10);

        corsProxy.setProxyList(config.proxyDomains, config.corsDomains, alwaysUseProxy);

        when(loadJson(params.data_menu || config.initialDataMenu || 'init_nm.json'), function(json) {
            try {
                application.catalog.updateFromJson(json.catalog);
            } catch (e) {
                var message = new PopupMessage({
                    container: document.body,
                    title: 'An error occurred while loading the catalog',
                    message: e.toString()
                });
            }

            if (params.start) {
                var startData = JSON.parse(params.start);
                application.catalog.updateFromJson(startData.catalog);
                config.initialCamera = {
                    west : CesiumMath.toDegrees(startData.camera.west),
                    south : CesiumMath.toDegrees(startData.camera.south),
                    east : CesiumMath.toDegrees(startData.camera.east),
                    north : CesiumMath.toDegrees(startData.camera.north)
                };
            }

            application.services.services = json.services;

            application.catalog.isLoading = false;

            var viewer = new AusGlobeViewer(config, application);

            document.getElementById('loadingIndicator').style.display = 'none';
        });
    });
}
