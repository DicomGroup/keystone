var keystone = require('../../');

/**
 * List draft option
 *
 * When enabled, allows a 'draft' state per item. Useful for previewing changes.
 */
module.exports = function draft () {
	var list = this;

	// Assign the draft model to the list
	list.getDraftModel = function (list) {
		return keystone.list(list.options.draft);
	};
};
