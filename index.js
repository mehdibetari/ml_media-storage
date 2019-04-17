const request      = require('request');
const AWS          = require('aws-sdk');

const Store = (props, callback) => {
    if (!props.sourceUrl) return callback(false);
    const awsS3Connect = new AWS.S3({
        accessKeyId: props.options.AWS_ACCESS_KEY,
        secretAccessKey: props.options.AWS_SECRET_ACCESS_KEY
      });
    _uploadOnDistant(props, awsS3Connect, callback);
};

const _uploadOnDistant = (props, awsS3Connect, callback) => {
    const s3ObjectParams = {
        Bucket: props.options.AWS_BUCKET_NAME,
        MaxKeys: 20,
        Delimiter: '/',
        Prefix: props.destinationPath
    };
    awsS3Connect.listObjectsV2 (s3ObjectParams, (err, data) => {
        if (err) {
            console.log(err);
        }
        if (data && data.Contents.length > 0) {
            const location = `https://${props.options.AWS_CF_BASE_URL}/${data.Contents[0].Key}`;
            console.log(`File already exist ${location}`);
            props.logger(`File already exist ${location}`);
            callback(location);
        }
        else {
            _uploadOnS3FromUrl(props, awsS3Connect, callback);
        }
    });
};

const _uploadOnS3FromUrl = ({sourceUrl, destinationPath, destinationFileName, logger, options}, awsS3Connect, callback) => {
    var params = {
        uri: sourceUrl,
        encoding: null
    };
    request(params, function(error, response, body) {
        if (error || response.statusCode !== 200) { 
            console.log("FAILED to get sourceUrl: ", sourceUrl);
            console.log(error);
            callback(false);
        } else {
            const params = {
                Bucket: options.AWS_BUCKET_NAME,
                Key: `${destinationPath}${destinationFileName}`,
                Body: body
            };
            awsS3Connect.upload(params, function(s3Err, data) {
                if (s3Err) throw s3Err;
                console.log(`File uploaded successfully at ${data.Location}`);
                logger(`File uploaded successfully at ${data.Location}`);
                callback(`https://${options.AWS_CF_BASE_URL}/${destinationPath}${destinationFileName}`);
            });
        }
    });
};

module.exports =  Store;
