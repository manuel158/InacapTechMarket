const assert = require('node:assert/strict');
const { PassThrough } = require('node:stream');
const { test } = require('node:test');
const createCloudinaryStorage = require('../storage/cloudinaryStorage');

test('sube imágenes al mismo directorio y devuelve los campos de Multer', async () => {
    let uploadOptions;
    const uploadStream = new PassThrough();
    const inputStream = new PassThrough();
    uploadStream.resume();
    uploadStream.on('finish', () => {
        callback(null, {
            secure_url: 'https://res.cloudinary.com/demo/image.jpg',
            bytes: 42,
            public_id: 'intechmarket/image'
        });
    });
    let callback;
    const storage = createCloudinaryStorage({
        uploader: {
            upload_stream(options, done) {
                uploadOptions = options;
                callback = done;
                return uploadStream;
            }
        }
    });
    const resultado = new Promise((resolve, reject) => {
        storage._handleFile({}, { stream: inputStream }, (error, file) => {
            if (error) return reject(error);
            return resolve(file);
        });
    });

    inputStream.end('test image');
    assert.deepEqual(await resultado, {
        path: 'https://res.cloudinary.com/demo/image.jpg',
        size: 42,
        filename: 'intechmarket/image'
    });
    assert.deepEqual(uploadOptions, {
        folder: 'intechmarket',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    });
});

test('elimina la imagen remota al limpiar un archivo', async () => {
    let argumentsReceived;
    const storage = createCloudinaryStorage({
        uploader: {
            async destroy(...args) {
                argumentsReceived = args;
                return { result: 'ok' };
            }
        }
    });

    await new Promise((resolve, reject) => {
        storage._removeFile({}, { filename: 'intechmarket/image' }, error => {
            if (error) return reject(error);
            return resolve();
        });
    });

    assert.deepEqual(argumentsReceived, [
        'intechmarket/image',
        { invalidate: true }
    ]);
});
