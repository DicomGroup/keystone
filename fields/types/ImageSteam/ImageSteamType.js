var FieldType = require('../Type');
var util = require('util');
var utils = require('keystone-utils');

const validateInput = (value) => {
	// undefined, null and empty values are always valid
	if (value === undefined || value === null || value === '') return true;
	// If a string is provided, check it is an upload or delete instruction
	if (typeof value === 'string' && /^(upload:)|(delete$)/.test(value)) return true;
	// If the value is an object with a filename property, it is a stored value
	// TODO: Need to actually check a dynamic path based on the adapter
	if (typeof value === 'object' && value.filename) return true;
	return false;
};

function ImageSteam (list, path, options) {
	this._underscoreMethods = ['format', 'upload', 'remove', 'reset'];
	this._fixedSize = 'full';

	if (!options.storage) {
		throw new Error(
			`Invalid Configuration\n
			ImageSteam fields (${list.key}.${path}) require storage to be provided.`
		);
	}

	this.storage = options.storage;
	ImageSteam.super_.call(this, list, path, options);
}

// Inherits - we can't use es6 classes here due to the nature of the parents constructor
ImageSteam.properName = 'ImageSteam';
util.inherits(ImageSteam, FieldType);

ImageSteam.prototype.addToSchema = function (schema) {
	this.paths = {};

	// add field paths from the storage schema
	Object.keys(this.storage.schema).forEach((path) => {
		this.paths[path] = `${this.path}.${path}`;
	});

	const schemaPaths = this._path.addTo({}, this.storage.schema);
	schema.add(schemaPaths);

	this.bindUnderscoreMethods();
};

ImageSteam.prototype.upload = function (item, file, callback) {

	// TODO; Validate there is actuall a file to upload
	this.storage.uploadFile(file, (err, result) => {
		if (err) {
			return callback(err);
		}

		item.set(this.path, result);
		return callback(null, result);
	});
};

ImageSteam.prototype.reset = function (item) {
	const value = {};
	Object.keys(this.storage.schema).forEach((path) => {
		value[path] = null;
	});
	item.set(this.path, value);
};

ImageSteam.prototype.remove = function (item) {
	this.storage.removeFile(item.get(this.path));
	this.reset();
};

ImageSteam.prototype.format = function (item) {
	const value = item.get(this.path);

	if (value) {
		return value.filename || '';
	}

	return '';
};

ImageSteam.prototype.isModified = function (item) {
	let modified = false;
	const paths = this.paths;
	Object.keys(this.storageSchema).forEach((path) => {
		if (item.isModified(paths[path])) {
			modified = true;
		}
	});

	return modified;
};

ImageSteam.prototype.validateInput = function (data, callback) {
	const value = this.getValueFromData(data);
	const result = validateInput(value);
	utils.defer(callback, result);
};

ImageSteam.prototype.validateRequiredInput = function (item, data, callback) {
	// TODO: We need to also get the `files` argument, so we can check for
	// uploaded files. without it, this will return false negatives so we
	// can't actually validate required input at the moment.
	const result = true;
	// var value = this.getValueFromData(data);
	// debug('[%s.%s] Validating required input: ', this.list.key, this.path, value);
	// TODO: Need to actually check a dynamic path based on the adapter
	// TODO: This incorrectly allows empty values in the object to pass validation
	// var result = (value || item.get(this.paths.filename)) ? true : false;
	// debug('[%s.%s] Validation result: ', this.list.key, this.path, result);
	utils.defer(callback, result);
};

ImageSteam.prototype.updateItem = function (item, data, files, callback) {

	// Process arguments
	if (typeof files === 'function') {
		callback = files;
		files = {};
	}
	if (!files) {
		files = {};
	}

	// Prepare values
	let value = this.getValueFromData(data);
	let uploadedFile;

	// Providing the string "remove" removes the file and resets the field
	if (value === 'remove') {
		this.remove(item);
		utils.defer(callback);
	}

	// Find an uploaded file in the files argument, either referenced in the
	// data argument or named with the field path / field_upload path + suffix
	if (typeof value === 'string' && value.substr(0, 7) === 'upload:') {
		uploadedFile = files[value.substr(7)];
	} else {
		uploadedFile = this.getValueFromData(files) || this.getValueFromData(files, '_upload');
	}

	// Ensure a valid file was uploaded, else null out the value
	if (uploadedFile && !uploadedFile.path) {
		uploadedFile = undefined;
	}

	// If we have a file to upload, we do that and stop here
	if (uploadedFile) {
		return this.upload(item, uploadedFile, callback);
	}

	// Empty / null values reset the field
	if (value === null || value === '' || (typeof value === 'object' && !Object.keys(value).length)) {
		this.reset(item);
		value = undefined;
	}

	// If there is a valid value at this point, set it on the field
	if (typeof value === 'object') {
		item.set(this.path, value);
	}

	return utils.defer(callback);
};

/* Export Field Type */
module.exports = ImageSteam;
