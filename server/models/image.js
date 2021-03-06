module.exports = function(Image) {

  Image.disableRemoteMethod('deleteById', true);
  Image.disableRemoteMethod('updateAll', true);
  Image.disableRemoteMethod('findOne', true);
  Image.disableRemoteMethod('findById', true);
  Image.disableRemoteMethod('exists', true);
  Image.disableRemoteMethod('createChangeStream', true);
  Image.disableRemoteMethod('count', true);
  Image.disableRemoteMethod('find', true);
  Image.disableRemoteMethod('prototype.updateAttributes', true);

  Image.uploadImage = function (req, drone, intervention,
                                latitude, longitude, takenAt, cb) {
    var imageStore = Image.app.models.ImageStore;
    imageStore.upload(drone,req, function(err,data){
      if (err) throw err;
      if (data.error)
        next('> response error: ' + err.error.stack);
      var img = {
        'intervention' : intervention,
        'drone' : drone,
        'geoPoint' : {
          longitude: longitude,
          latitude: latitude,
          altitude: 0
        },
        'takenAt' : takenAt,
        'link' : '/api/ImageStores/'+drone+'/download/'+data._id
      };
      Image.create(img, function(err,data){
        if (err) throw err;
        if (data.error)
          next('> response error: ' + err.error.stack);
        cb(null,data);
      });
    });
  };

  Image.uploadImageVideo = function (req, drone, intervention, iDrone,
                                     takenAt, cb) {
    var imageStore = Image.app.models.ImageStore;
    imageStore.upload(drone,req, function(err,data){
      if (err) throw err;
      if (data.error)
        next('> response error: ' + err.error.stack);
      var img = {
        'link' : '/api/ImageStores/'+drone+'/download/'+data._id,
        'intervention' : intervention,
        'takenAt' : takenAt,
        'geoPoint' : {},
        'drone' : drone,
        'id': iDrone
      };
      Image.upsert(img, function(err,data){
        if (err) throw err;
        if (data.error)
          next('> response error: ' + err.error.stack);
        cb(null,data);
      });
    });
  };

  Image.findByInterventionAndPosition = function (id,latitude,longitude,cb) {
    Image.find({ where: {intervention: id}}, function(err, Images) {
      var data = Images.filter(function(image) {
        return image.geoPoint.latitude === latitude &&
          image.geoPoint.longitude === longitude;
      });
      cb(null, data);
    });
  };

  Image.getByIntervention = function(id, cb) {
    Image.find({ where: {intervention: id}}, function(err, Images) {
      cb(null, Images);
    });
  };

  Image.remoteMethod('findByInterventionAndPosition', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      { arg: 'latitude', type: 'string', http: { source: 'query' } },
      { arg: 'longitude', type: 'string', http: { source: 'query' } }
    ],
    returns: {type: 'array', root: true},
    http: {verb: 'get', path: '/intervention/:id/geoPoint'}
  });

  Image.remoteMethod('getByIntervention', {
      http: {path: '/intervention/:id', verb: 'get'},
      accepts: {arg: 'id', type: 'string', required: true},
      returns: {type: 'array', root: true},
      rest: {after: convertNullToNotFoundError}
    });

  function convertNullToNotFoundError(ctx, cb) {
    if (ctx.result !== null) return cb();

    var modelName = ctx.method.sharedClass.name;
    var id = ctx.getArgByName('id');
    var msg = 'Unknown "' + modelName + '" id "' + id + '".';
    var error = new Error(msg);
    error.statusCode = error.status = 404;
    error.code = 'MODEL_NOT_FOUND';
    cb(error);
  }

  Image.remoteMethod('uploadImage', {
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'drone', type: 'string', http: { source: 'query' } },
      { arg: 'intervention', type: 'string', http: { source: 'query' } },
      { arg: 'latitude', type: 'string', http: { source: 'query' } },
      { arg: 'longitude', type: 'string', http: { source: 'query' } },
      { arg: 'takenAt', type: 'date', http: { source: 'query' } }
    ],
    returns: {type: 'object', root: true},
    http: {verb: 'post', path: '/upload'}
  });

  Image.remoteMethod('uploadImageVideo', {
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'drone', type: 'string', http: { source: 'query' } },
      { arg: 'intervention', type: 'string', http: { source: 'query' } },
      { arg: 'iDrone', type: 'string', http: { source: 'query' } },
      { arg: 'takenAt', type: 'date', http: { source: 'query' } }
    ],
    returns: {type: 'object', root: true},
    http: {verb: 'post', path: '/uploadVideo'}
  });

  Image.afterRemote('uploadImage',function (ctx, unused, next) {
    sendPushMessage(ctx.result, 'Image/Create');
    next();
  });

  function sendPushMessage(image,topic){
    var pushMessage = {
      idIntervention : image.intervention,
      idElement : image.id,
      timestamp : new Date(Date.now()),
      topic : topic
    };
    var pushService = Image.app.datasources.pushService;
    pushService.create(pushMessage, function(err,data){
      if (err) throw err;
      if (data.error)
        next('> response error: ' + err.error.stack);
    });
  }

};
