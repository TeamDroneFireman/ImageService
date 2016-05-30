module.exports = function(Image) {

  Image.disableRemoteMethod('deleteById', true);
  Image.disableRemoteMethod('updateAll', true);
  Image.disableRemoteMethod('findOne', true);
  Image.disableRemoteMethod('findById', true);
  Image.disableRemoteMethod('exists', true);
  Image.disableRemoteMethod('createChangeStream', true);
  Image.disableRemoteMethod('count', true);
  Image.disableRemoteMethod('upsert', true);
  Image.disableRemoteMethod('find', true);
  Image.disableRemoteMethod('prototype.updateAttributes', true);

  Image.uploadImage = function (req, drone, intervention,
                                latitude,longitude, takenAt, cb) {
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

  Image.findByInterventionAndPosition = function (id,latitude,longitude,cb) {
    Image.find({ where: {intervention: id}}, function(err, Images) {
      var data = Images.filter(function(image) {
        return image.geoPoint.latitude === latitude &&
          image.geoPoint.longitude === longitude;
      });
      cb(null, data);
    });
  };

  Image.remoteMethod('findByInterventionAndPosition', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      { arg: 'latitude', type: 'string', http: { source: 'query' } },
      { arg: 'longitude', type: 'string', http: { source: 'query' } }
    ],
    returns: {type: 'array', root: true},
    http: {verb: 'get', path: '/intervention/:id'}
  });

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
};
