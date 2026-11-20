function createCloudinaryStorage(cloudinary) {
    return {
        _handleFile(_req, file, callback) {
            try {
                const stream = cloudinary.uploader.upload_stream({
                    folder: 'intechmarket',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
                }, (error, result) => {
                    if (error) return callback(error);
                    return callback(null, {
                        path: result.secure_url,
                        size: result.bytes,
                        filename: result.public_id
                    });
                });
                file.stream.pipe(stream);
            } catch (error) {
                callback(error);
            }
        },
        _removeFile(_req, file, callback) {
            cloudinary.uploader.destroy(file.filename, { invalidate: true })
                .then(() => callback(null), callback);
        }
    };
}

module.exports = createCloudinaryStorage;
