// # A Freeboard Plugin that uses the Eclipse Paho javascript client to read MQTT messages

(function()
{
    // ### Datasource Definition
    //
    // -------------------
    freeboard.loadDatasourcePlugin({
        "type_name"   : "paho_mqtt_js",
        "display_name": "Paho MQTT Client",
        "description" : "Receive data from an MQTT server using Websockets",
        "external_scripts" : [
            "plugins/thirdparty/freeboard-mqtt-paho/mqttws31.js"
        ],
        "settings"    : [
            {
                "name"         : "server",
                "display_name" : "MQTT Broker",
                "type"         : "text",
                "description"  : "Hostname for your MQTT Broker",
                "required"     : true
            },
            {
                "name"        : "port",
                "display_name": "Port",
                "type"        : "number",
                "description" : "Websockets port on the broker",
                "required"    : true
            },
            {
                "name"        : "client_id",
                "display_name": "Client Id",
                "type"        : "text",
                "required"    : true
            },
            {
                "name"        : "topics",
                "display_name": "Topics",
                "type"        : "text",
                "description" : "The topics to subscribe to, seperated by semicolon",
                "required"    : true
            }
        ],
        // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
        // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
        // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
        // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
        newInstance   : function(settings, newInstanceCallback, updateCallback)
        {
            newInstanceCallback(new mqttDatasourcePlugin(settings, updateCallback));
        }
    });

    var mqttDatasourcePlugin = function(settings, updateCallback)
    {
        var self = this;
        var data = {};
        var topicList = [];

        var currentSettings = settings;

        function onConnect() {
            console.log("Connected");
            // Split the topics into a list
            topicList = currentSettings.topics.split( ";" )

            topicList.map( function(topic) {
                console.log( "Subscribing to " + topic )
                // Subscribe to all the topics in list
                client.subscribe( topic )
                // add it to data list so that it will be available at dropdown
                data[topic] = {}
            });
            // update the data to main to populate the topics list there
            updateCallback( data );
        };

        function onConnectionLost(responseObject) {
            if (responseObject.errorCode !== 0)
                console.log("onConnectionLost:"+responseObject.errorMessage);
        };

        function onMessageArrived(message) {
            // console.log( "! t: " + message.destinationName )
            // console.log( "  m: " + message.payloadString )
            // Try to parse as JSON message, if failed revert to plain text
            try {
                data[message.destinationName] = JSON.parse( message.payloadString )
            } catch(err) {
                data[message.destinationName] = message.payloadString
            }
            updateCallback( data );
        };

        function onFailure( message ) {
            console.log( "Connection failed - " + message.errorMessage )
        }

        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function(newSettings)
        {
            client.disconnect();
            data = {};
            currentSettings = newSettings;
            options = {
                timeout: 3,
                onSuccess: onConnect,
                onFailure: onFailure
            }
            client.connect( options );
        }

        // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
        self.updateNow = function()
        {
            // Don't need to do anything here, can't pull an update from MQTT.
        }

        // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onDispose = function()
        {
            if (client.isConnected()) {
                console.log( "Disconnecting from broker..." )
                client.disconnect();
            }
            client = {};
        }

        options = {
            timeout: 3,
            onSuccess: onConnect,
            onFailure: onFailure
        }

        var client = new Paho.MQTT.Client(currentSettings.server,
                                        currentSettings.port,
                                        currentSettings.client_id);
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;
        console.log( "Attempting connection..." );
        client.connect( options );
    }
}());
