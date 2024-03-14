const fs = require('fs')

function RoutesLoader() { }

RoutesLoader.loadToAppFromPath = function (app, controllerPath) {

    fs.readdirSync(controllerPath).forEach(function (objectName) {
        const objectPath = controllerPath + '/' + objectName;
        const objectStats = fs.lstatSync(objectPath);

        if (RoutesLoader._isSystemObject(objectName)) {
            return;
        }
        if (objectStats.isFile()) {
            app.use('/api/v1', require(objectPath))
        } else if (objectStats.isDirectory()) {
            RoutesLoader.loadToAppFromPath(app, objectPath);
        }
    });
};

RoutesLoader._isSystemObject = function (objectName) {
    return objectName.indexOf('.') === 0;
};

module.exports = RoutesLoader;
