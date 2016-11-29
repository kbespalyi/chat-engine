"use strict";

const defaults = {timeout: 1000};

module.exports = function(config) {

    var send = {
        message: function(payload, next) {

            payload.data.text += " pub_append 1";

            next(null, payload);
        }
    };

    var subscribe = {
        message: function(payload, next) {
            
            payload.data.text += " sub_append 1";

            next(null, payload);
        }
    };

    return {
        middleware: {send, subscribe}
    }

}
