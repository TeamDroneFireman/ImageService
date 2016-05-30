module.exports = function(Image) {

  Image.disableRemoteMethod('deleteById', true);
  Image.disableRemoteMethod('updateAll', true);
  Image.disableRemoteMethod('createChangeStream', true);

  Image.uploadImage = function (req, drone, intervention, position, takenAt, cb) {
    var imageStore = Image.app.models.ImageStore;
    imageStore.upload(drone,req, function(err,data){
      if (err) throw err;
      if (data.error)
        next('> response error: ' + response.error.stack);
      var img = {
        'intervention' : intervention,
        'drone' : drone,
        'position' : position,
        'takenAt' : takenAt,
        'link' : '/api/ImageStores/'+drone+'/download/'+data._id
      };
      Image.create(img, function(err,data){
        if (err) throw err;
        if (data.error)
          next('> response error: ' + response.error.stack);
        cb(null,data);
      });
    });
  };

  Image.remoteMethod('uploadImage', {
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'drone', type: 'string', http: { source: 'query' } },
      { arg: 'position', type: 'object', http: { source: 'query' } },
      { arg: 'takenAt', type: 'date', http: { source: 'query' } }
    ],
    returns: {type: 'object', root: true},
    http: {verb: 'post', path: '/upload'}
  });
};
