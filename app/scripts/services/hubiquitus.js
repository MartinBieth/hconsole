'use strict';

angular.module('hconsoleApp').factory('hubiquitus', function ($rootScope, $window) {

    $rootScope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    var hClient;
    var connected = false;
    var onConnectedCallback, onConnectingCallback, onErrorCallback, onDisconnectedCallback, onMessageCallback;

    function init() {
        hClient = $window.hClient;

        hClient.onStatus = function (hStatus) {
            console.debug('onStatus', hStatus);
            switch (hStatus.status) {
            case hClient.statuses.CONNECTED:
                connected = true;
                if (typeof onConnectedCallback === 'function') {
                    $rootScope.safeApply(onConnectedCallback);
                }
                break;
            case hClient.statuses.CONNECTING:
                if (typeof onConnectingCallback === 'function') {
                    $rootScope.safeApply(onConnectingCallback);
                }
                break;
            case hClient.statuses.DISCONNECTED:
                connected = false;
                if (typeof onDisconnectedCallback === 'function') {
                    $rootScope.safeApply(onDisconnectedCallback);
                }
                break;
            }

            if (typeof onErrorCallback === 'function') {
                switch (hStatus.errorCode) {
                case hClient.errors.NO_ERROR:
                    break;
                case hClient.errors.URN_MALFORMAT:
                    $rootScope.safeApply(function () {
                        onErrorCallback.call(this, 'URN Malformat');
                    });
                    break;
                case hClient.errors.CONN_TIMEOUT:
                    $rootScope.safeApply(function () {
                        onErrorCallback.call(this, 'Connection timed out');
                    });
                    break;
                case hClient.errors.AUTH_FAILED:
                    $rootScope.safeApply(function () {
                        onErrorCallback.call(this, 'Authentication failed');
                    });
                    break;
                case hClient.errors.ALREADY_CONNECTED:
                    $rootScope.safeApply(function () {
                        onErrorCallback.call(this, 'A connection is already opened');
                    });
                    break;
                case hClient.errors.TECH_ERROR:
                    $rootScope.safeApply(function () {
                        onErrorCallback.call(this, 'Technical Error: ' + hStatus.errorMsg);
                    });
                    break;
                case hClient.errors.NOT_CONNECTED:
                    $rootScope.safeApply(function () {
                        onErrorCallback.call(this, 'Not connected');
                    });
                    break;
                case hClient.errors.CONN_PROGRESS:
                    $rootScope.safeApply(function () {
                        onErrorCallback.call(this, 'A connection is already in progress');
                    });
                    break;
                }
            }

            hClient.onMessage = function (hMessage) {
                console.debug('onMessage', hMessage);
                if (typeof onMessageCallback === 'funtion') {
                    $rootScope.safeApply(function () {
                        onMessageCallback.call(this, hMessage);
                    });
                }
            };
        };
    }

    return {
        isConnected: function () {
            return connected;
        },
        connect: function (login, password, endpoint) {
            if (!hClient) {
                init();
            }
            hClient.connect(login, password, {
                transport: 'socketio',
                endpoints: [endpoint]
            });
        },
        subscribe: function (actor, callback) {
            hClient.subscribe(actor, function (hMessage) {
                console.debug('subscribe', hMessage);
                $rootScope.safeApply(callback);
            });
        },
        disconnect: function () {
            hClient.disconnect();
        },
        onConnected: function (callback) {
            onConnectedCallback = callback;
        },
        onConnecting: function (callback) {
            onConnectingCallback = callback;
        },
        onError: function (callback) {
            onErrorCallback = callback;
        },
        onDisconnected: function (callback) {
            onDisconnectedCallback = callback;
        },
        onMessage: function (callback) {
            onMessageCallback = callback;
        }
    };

});
